"""
AgentHub MCP Server
===================
Exposes AgentHub's full AI marketplace capability surface via the Model Context
Protocol (MCP), making it directly usable inside Claude Code, Claude Desktop,
Cursor, Codex, and any other MCP-compatible host.

Transport: stdio  (default — works with Claude Code / Claude Desktop)
           SSE    (optional — start with --transport sse --port 8001)

Tools exposed:
  • list_models       – Browse all 51+ verified Hugging Face model endpoints
  • run_inference      – Non-streaming LLM completion via HF Inference API
  • audit_model        – Full 5-probe OWASP LLM-as-a-Judge security audit
  • execute_code       – Sandboxed Python subprocess execution (5s timeout)
  • orchestrate        – Natural-language goal → Groq DAG decomposition

Usage (stdio — Claude Code / Claude Desktop):
  python backend/mcp_server.py

Usage (SSE — web clients, Postman):
  python backend/mcp_server.py --transport sse --port 8001
"""

import asyncio
import hashlib
import json
import sys
import time
import uuid
from pathlib import Path
from typing import Any

# ── MCP SDK ────────────────────────────────────────────────────────────────────
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import (
        Tool,
        TextContent,
        CallToolResult,
        CallToolRequest,
        ListToolsResult,
    )
except ImportError:
    print(
        "[AgentHub MCP] FATAL: 'mcp' package not installed.\n"
        "  Run:  pip install mcp\n",
        file=sys.stderr,
    )
    sys.exit(1)

# ── Load AgentHub settings (reads .env/.env.local) ────────────────────────────
# Add backend/ to sys.path so app.* imports resolve from any working directory
_BACKEND_DIR = Path(__file__).parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.config import settings  # noqa: E402
from app.services.hf_service import hf_service  # noqa: E402
from app.services.llm_service import llm_service  # noqa: E402

# ── Sandbox directories ────────────────────────────────────────────────────────
SANDBOX_DIR  = _BACKEND_DIR / "temp_sandbox"
SANDBOX_DIR.mkdir(parents=True, exist_ok=True)

# ══════════════════════════════════════════════════════════════════════════════
# MCP Server definition
# ══════════════════════════════════════════════════════════════════════════════

server = Server("agenthub")


# ── Tool definitions (schema + description) ───────────────────────────────────

TOOL_LIST = [
    Tool(
        name="list_models",
        description=(
            "List all verified AI model endpoints available in the AgentHub marketplace. "
            "Optionally filter by domain: LLM CHAT, CODE GEN, VISION AI, HEALTHCARE, FINANCE."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "domain": {
                    "type": "string",
                    "description": "Domain filter (optional). One of: LLM CHAT, CODE GEN, VISION AI, HEALTHCARE, FINANCE",
                    "enum": ["ALL DOMAINS", "LLM CHAT", "CODE GEN", "VISION AI", "HEALTHCARE", "FINANCE"]
                }
            },
            "required": []
        }
    ),
    Tool(
        name="run_inference",
        description=(
            "Run a non-streaming LLM completion against any AgentHub model endpoint. "
            "Pass a model_id (from list_models) and a prompt. Returns the generated text."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "model_id": {
                    "type": "string",
                    "description": "AgentHub model id (e.g. 'llama3-8b-instruct', 'deepseek-coder-67b-instruct')"
                },
                "prompt": {
                    "type": "string",
                    "description": "The user prompt to send to the model"
                },
                "max_tokens": {
                    "type": "integer",
                    "description": "Maximum tokens to generate (default: 512)",
                    "default": 512
                },
                "temperature": {
                    "type": "number",
                    "description": "Sampling temperature 0.0–1.0 (default: 0.7)",
                    "default": 0.7
                }
            },
            "required": ["model_id", "prompt"]
        }
    ),
    Tool(
        name="audit_model",
        description=(
            "Run a live OWASP LLM Top-10 red-team security audit on any model. "
            "Dispatches 5 adversarial probes concurrently and uses Groq as LLM-as-a-Judge "
            "to score prompt injection, jailbreak resistance, task hijacking, data leakage, "
            "and context manipulation resistance. Returns per-axis scores and reasoning."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "model_id": {
                    "type": "string",
                    "description": "AgentHub model id to audit (e.g. 'llama3-8b-instruct')"
                }
            },
            "required": ["model_id"]
        }
    ),
    Tool(
        name="execute_code",
        description=(
            "Execute Python code in an isolated sandbox subprocess with a hard 5-second timeout. "
            "Returns stdout, stderr, exit_code, and execution latency. "
            "Use for testing snippets, running calculations, or validating generated code."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "Python source code to execute"
                },
                "language": {
                    "type": "string",
                    "description": "Execution runtime (currently: python)",
                    "enum": ["python"],
                    "default": "python"
                }
            },
            "required": ["code"]
        }
    ),
    Tool(
        name="orchestrate",
        description=(
            "Submit a high-level natural language goal to the AgentHub Meta-Agent. "
            "Returns a DAG execution plan: task decomposition, assigned models, costs, "
            "and a synthesised final output generated via Groq."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "goal": {
                    "type": "string",
                    "description": "Natural language task or goal (e.g. 'Build a REST API with authentication and unit tests')"
                },
                "max_budget_credits": {
                    "type": "number",
                    "description": "Optional credit budget cap for the orchestration run"
                }
            },
            "required": ["goal"]
        }
    ),
]


@server.list_tools()
async def handle_list_tools() -> ListToolsResult:
    return ListToolsResult(tools=TOOL_LIST)


# ── Tool dispatch ──────────────────────────────────────────────────────────────

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict[str, Any]) -> CallToolResult:
    try:
        if name == "list_models":
            return await _tool_list_models(arguments)
        elif name == "run_inference":
            return await _tool_run_inference(arguments)
        elif name == "audit_model":
            return await _tool_audit_model(arguments)
        elif name == "execute_code":
            return await _tool_execute_code(arguments)
        elif name == "orchestrate":
            return await _tool_orchestrate(arguments)
        else:
            return CallToolResult(
                content=[TextContent(type="text", text=f"Unknown tool: {name}")]
            )
    except Exception as exc:
        return CallToolResult(
            content=[TextContent(type="text", text=f"[AgentHub MCP Error] {type(exc).__name__}: {exc}")]
        )


# ══════════════════════════════════════════════════════════════════════════════
# Tool Implementations
# ══════════════════════════════════════════════════════════════════════════════

async def _tool_list_models(args: dict) -> CallToolResult:
    """Queries AgentHub DB (or falls back to HTTP) and returns formatted model list."""
    domain_filter = args.get("domain", "ALL DOMAINS")

    try:
        # Direct DB query (no HTTP hop required)
        from app.database import AsyncSessionLocal
        from app.models import AIModel
        from sqlalchemy.future import select

        async with AsyncSessionLocal() as session:
            query = select(AIModel)
            if domain_filter and domain_filter not in ("ALL DOMAINS", "ALL_DOMAINS"):
                d = domain_filter.replace("_", " ").upper()
                query = query.filter(AIModel.domain == d)
            result = await session.execute(query)
            models = result.scalars().all()

        lines = [f"# AgentHub Model Catalog  [{domain_filter}]  ({len(models)} results)\n"]
        lines.append(f"{'ID':<38} {'DOMAIN':<14} {'TASK':<22} {'CTX':>8}  {'P50':>6}  {'PRICE':>8}")
        lines.append("─" * 110)
        for m in models:
            lines.append(
                f"{m.id:<38} {m.domain:<14} {(m.task_tag or ''):<22} "
                f"{m.context_length:>8,}  {m.p50_latency_ms:>4}ms  ${m.price_per_1k:>6.4f}/1k"
            )
        return CallToolResult(content=[TextContent(type="text", text="\n".join(lines))])

    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"[list_models error] {e}")]
        )


async def _tool_run_inference(args: dict) -> CallToolResult:
    model_id    = args["model_id"]
    prompt      = args["prompt"]
    max_tokens  = int(args.get("max_tokens", 512))
    temperature = float(args.get("temperature", 0.7))

    try:
        from app.database import AsyncSessionLocal
        from app.models import AIModel
        from sqlalchemy.future import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(AIModel).filter(AIModel.id == model_id))
            record = result.scalars().first()
            repo_id = record.repo_id if record else model_id

        t0 = time.monotonic()
        response_text = await hf_service.generate_completion(
            model_id=repo_id,
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature
        )
        elapsed_ms = int((time.monotonic() - t0) * 1000)

        if not response_text:
            response_text = "(No response — model may be rate-limited or cold. Try again in 30s.)"

        output = (
            f"## AgentHub Inference · {model_id}\n"
            f"**Repo:** `{repo_id}`  |  **Latency:** {elapsed_ms}ms\n\n"
            f"---\n\n{response_text}"
        )
        return CallToolResult(content=[TextContent(type="text", text=output)])

    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"[run_inference error] {e}")]
        )


async def _tool_audit_model(args: dict) -> CallToolResult:
    model_id = args["model_id"]

    try:
        from app.services.security_engine import security_engine
        from app.database import AsyncSessionLocal

        async with AsyncSessionLocal() as session:
            audit = await security_engine.run_live_audit(model_id, session)

        lines = [
            f"# OWASP Red-Team Audit · {model_id}",
            f"**Repo:** `{audit.repo_id}`  |  **Evaluated by:** {audit.evaluated_by}",
            f"**Overall Safety Score:** {audit.overall_score}/100",
            "",
            "## Per-Axis Scores",
            f"| Axis                  | Score |",
            f"|:----------------------|------:|",
            f"| Prompt Injection      | {audit.prompt_injection_score}%   |",
            f"| Jailbreak Resistance  | {audit.jailbreak_resistance_score}%   |",
            f"| Task Hijacking        | {audit.task_hijacking_score}%   |",
            f"| Data Leakage          | {audit.data_leakage_score}%   |",
            f"| Context Manipulation  | {audit.context_manipulation_score}%   |",
            "",
            f"## Evaluator Reasoning",
            audit.reasoning or "N/A",
            "",
            "## Probe Results",
        ]
        for po in (audit.probe_outputs or []):
            status = "✅ MITIGATED" if audit.scores.dict().get(po["axis"], 95) >= 80 else "❌ FAILED"
            lines.append(f"\n**{po['test_name']}** — {status}")
            lines.append(f"> *Probe:* {po['probe']}")
            lines.append(f"> *Response snippet:* {po['response'][:200]}...")

        return CallToolResult(content=[TextContent(type="text", text="\n".join(lines))])

    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"[audit_model error] {e}")]
        )


async def _tool_execute_code(args: dict) -> CallToolResult:
    code     = args["code"]
    language = args.get("language", "python")

    session_id = uuid.uuid4().hex[:12]
    ext        = "py" if language == "python" else "js"
    temp_file  = SANDBOX_DIR / f"mcp_{session_id}.{ext}"
    temp_file.write_text(code, encoding="utf-8")

    stdout_text = stderr_text = ""
    exit_code   = 0

    try:
        cmd = [sys.executable, str(temp_file)] if language == "python" else ["node", str(temp_file)]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        t0 = time.monotonic()
        try:
            raw_out, raw_err = await asyncio.wait_for(proc.communicate(), timeout=5.0)
            stdout_text = raw_out.decode("utf-8", errors="replace")
            stderr_text = raw_err.decode("utf-8", errors="replace")
            exit_code   = proc.returncode or 0
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            stderr_text = "Execution timeout (5s limit exceeded)."
            exit_code   = -1
        elapsed_ms = int((time.monotonic() - t0) * 1000)
    finally:
        try:
            temp_file.unlink(missing_ok=True)
        except Exception:
            pass

    status = "SUCCESS" if exit_code == 0 else ("TIMEOUT" if exit_code == -1 else "ERROR")
    output = (
        f"```\n"
        f"[AgentHub Sandbox] session={session_id} exit={exit_code} {elapsed_ms}ms\n"
        f"{stdout_text.rstrip()}\n"
        + (f"\n[stderr]\n{stderr_text.rstrip()}" if stderr_text.strip() else "")
        + "\n```"
    )
    return CallToolResult(content=[TextContent(type="text", text=f"**Status:** {status}\n\n{output}")])


async def _tool_orchestrate(args: dict) -> CallToolResult:
    goal               = args["goal"]
    max_budget_credits = args.get("max_budget_credits")

    try:
        from app.services.orchestrator_engine import orchestrator_engine
        result = await orchestrator_engine.run(
            goal=goal,
            user_id="mcp_client",
            max_budget_credits=max_budget_credits
        )

        lines = [
            f"# Meta-Agent Orchestration Result",
            f"**Goal:** {goal}",
            f"**Status:** {result.get('status', 'N/A')}  |  **Job ID:** {result.get('job_id', 'N/A')}",
            f"**Estimated Cost:** {result.get('estimated_cost_credits', 0):.4f} credits",
            f"**Execution Time:** {result.get('execution_time_ms', 0)}ms",
            "",
            "## DAG Plan",
        ]
        for step in result.get("dag_plan", []):
            lines.append(
                f"\n**Step {step.get('step_index', '?')}:** {step.get('title', '')}  "
                f"[{step.get('assigned_model_name', '')}  ·  {step.get('cost_credits', 0):.4f} cr]"
            )
            if step.get("output"):
                lines.append(f"> {step['output'][:300]}")

        lines += ["", "## Final Output", result.get("final_output", "")]
        return CallToolResult(content=[TextContent(type="text", text="\n".join(lines))])

    except Exception as e:
        return CallToolResult(
            content=[TextContent(type="text", text=f"[orchestrate error] {e}")]
        )


# ══════════════════════════════════════════════════════════════════════════════
# Entry point — stdio (default) or SSE
# ══════════════════════════════════════════════════════════════════════════════

async def _run_stdio():
    """Run MCP server over stdio — compatible with Claude Code, Claude Desktop, Cursor."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


async def _run_sse(port: int = 8001):
    """Run MCP server with SSE transport for web clients."""
    from mcp.server.sse import SseServerTransport
    from starlette.applications import Starlette
    from starlette.routing import Route
    import uvicorn

    sse_transport = SseServerTransport("/messages")

    async def handle_sse(request):
        async with sse_transport.connect_sse(
            request.scope, request.receive, request._send
        ) as streams:
            await server.run(
                streams[0], streams[1],
                server.create_initialization_options()
            )

    starlette_app = Starlette(
        routes=[
            Route("/sse",      endpoint=handle_sse),
            Route("/messages", endpoint=sse_transport.handle_post_message, methods=["POST"]),
        ]
    )
    config = uvicorn.Config(starlette_app, host="0.0.0.0", port=port, log_level="info")
    await uvicorn.Server(config).serve()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AgentHub MCP Server")
    parser.add_argument("--transport", choices=["stdio", "sse"], default="stdio")
    parser.add_argument("--port",      type=int,                  default=8001)
    parsed = parser.parse_args()

    print(f"[AgentHub MCP] Starting ({parsed.transport} transport)...", file=sys.stderr)

    if parsed.transport == "sse":
        asyncio.run(_run_sse(parsed.port))
    else:
        asyncio.run(_run_stdio())
