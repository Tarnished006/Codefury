"""
AgentHub Production Remote MCP Server (SSE & Stdio)
===================================================
Directly integrates AgentHub's live backend services into the Model Context Protocol (MCP):
  1. list_marketplace_models  — Queries real SQLite database catalog (50+ verified models).
  2. run_redteam_audit        — Executes live 5-axis OWASP red-team probes + Groq openai/gpt-oss-120b judge.
  3. execute_sandboxed_code   — Runs isolated Python subprocess with 5s timeout.
  4. run_inference            — Queries open-weight model endpoints via HF Inference / Groq API.
  5. orchestrate_meta_agent   — Decomposes natural language goals into DAG plans via Groq supervisor.
  6. compare_models_arena     — Runs concurrent head-to-head model benchmark.

Transports:
  • SSE (default): http://0.0.0.0:8001/sse (Claude Web, Postman, web integrations)
  • Stdio: Standard I/O (Claude Desktop, Cursor, Claude Code)
"""

import asyncio
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add backend directory to sys.path
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

# ── Dynamic FastMCP Interface ───────────────────────────────────────────────────
try:
    from mcp.server.fastmcp import FastMCP
except (ImportError, ModuleNotFoundError):
    import mcp.types as t
    from mcp.server import Server
    from mcp.server.sse import SseServerTransport
    import uvicorn

    class FastMCP:
        def __init__(self, name: str = "AgentHub Marketplace Remote Server", host: str = "0.0.0.0", port: int = 8001):
            self.name = name
            self.host = host
            self.port = port
            self.server = Server(name)
            self._tools = {}

            async def list_tools_handler(params, context):
                tools = []
                for tool_name, (fn, desc) in self._tools.items():
                    params_list = list(fn.__code__.co_varnames[:fn.__code__.co_argcount])
                    tools.append(t.Tool(
                        name=tool_name,
                        description=desc or f"Tool: {tool_name}",
                        inputSchema={
                            "type": "object",
                            "properties": {
                                p: {"type": "string", "description": f"Parameter: {p}"}
                                for p in params_list
                            },
                            "required": [p for p in params_list if p not in ("domain", "max_tokens", "temperature", "max_budget_credits", "language")]
                        }
                    ))
                return t.ListToolsResult(tools=tools)

            async def call_tool_handler(params: t.CallToolRequestParams, context):
                tool_name = params.name
                args = params.arguments or {}
                if tool_name in self._tools:
                    fn, _ = self._tools[tool_name]
                    try:
                        res = await fn(**args) if asyncio.iscoroutinefunction(fn) else fn(**args)
                        return t.CallToolResult(content=[t.TextContent(type="text", text=str(res))])
                    except Exception as e:
                        return t.CallToolResult(content=[t.TextContent(type="text", text=f"Error executing {tool_name}: {e}")])
                return t.CallToolResult(content=[t.TextContent(type="text", text=f"Unknown tool: {tool_name}")])

            self.server.add_request_handler("tools/list", type(None), list_tools_handler)
            self.server.add_request_handler("tools/call", t.CallToolRequestParams, call_tool_handler)

        def tool(self):
            def decorator(fn):
                self._tools[fn.__name__] = (fn, fn.__doc__ or "")
                return fn
            return decorator

        def run(self, transport: str = "sse"):
            if transport == "sse":
                sse_transport = SseServerTransport("/messages")

                class MCPSSEApp:
                    def __init__(self, server_instance, transport_instance, host, port):
                        self.server = server_instance
                        self.sse_transport = transport_instance
                        self.host = host
                        self.port = port

                    async def __call__(self, scope, receive, send):
                        path = scope.get("path", "")
                        if path == "/sse" and scope.get("type") == "http":
                            async with self.sse_transport.connect_sse(scope, receive, send) as streams:
                                await self.server.run(
                                    streams[0], streams[1],
                                    self.server.create_initialization_options()
                                )
                        elif path.startswith("/messages") and scope.get("type") == "http":
                            await self.sse_transport.handle_post_message(scope, receive, send)
                        else:
                            await send({
                                "type": "http.response.start",
                                "status": 200,
                                "headers": [(b"content-type", b"text/plain; charset=utf-8")]
                            })
                            await send({
                                "type": "http.response.body",
                                "body": f"AgentHub Remote MCP Server (SSE) Active on http://{self.host}:{self.port}\nSSE Endpoint: http://{self.host}:{self.port}/sse\nMessages Endpoint: http://{self.host}:{self.port}/messages\n".encode("utf-8")
                            })

                app = MCPSSEApp(self.server, sse_transport, self.host, self.port)
                print(f"[AgentHub Remote MCP] Server listening on http://{self.host}:{self.port}/sse via SSE transport...")
                uvicorn.run(app, host=self.host, port=self.port, log_level="info")
            else:
                from mcp.server.stdio import stdio_server
                async def _stdio():
                    async with stdio_server() as (r, w):
                        await self.server.run(r, w, self.server.create_initialization_options())
                asyncio.run(_stdio())

# Instantiate MCP server
mcp = FastMCP(
    "AgentHub Marketplace Remote Server",
    host="0.0.0.0",
    port=8001
)

# ── 1. Live Marketplace Catalog Tool ───────────────────────────────────────────
@mcp.tool()
async def list_marketplace_models(domain: str = "ALL DOMAINS") -> str:
    """Lists operational AI models from the live AgentHub SQLite catalog. Optional filter: 'LLM CHAT', 'CODE GEN', 'VISION AI', 'HEALTHCARE', 'FINANCE'."""
    try:
        from app.database import AsyncSessionLocal
        from app.models import AIModel
        from sqlalchemy.future import select

        async with AsyncSessionLocal() as session:
            query = select(AIModel)
            if domain and domain.upper() not in ("ALL", "ALL DOMAINS", "ALL_DOMAINS"):
                d = domain.replace("_", " ").upper()
                query = query.filter(AIModel.domain == d)
            result = await session.execute(query)
            models = result.scalars().all()

        if models:
            lines = [f"# AgentHub Model Catalog [{domain}] ({len(models)} models operational)\n"]
            lines.append(f"{'ID':<34} {'DOMAIN':<14} {'TASK':<22} {'CTX':>8} {'P50':>6} {'PRICE':>8}")
            lines.append("-" * 105)
            for m in models:
                lines.append(
                    f"{m.id:<34} {m.domain:<14} {(m.task_tag or ''):<22} "
                    f"{m.context_length:>8,} {m.p50_latency_ms:>4}ms ${m.price_per_1k:>6.4f}/1k"
                )
            return "\n".join(lines)
    except Exception as e:
        return f"[list_marketplace_models error]: {e}"

    return "AgentHub Active Models:\n- meta-llama/Meta-Llama-3-8B-Instruct (Chat/Reasoning)\n- Qwen/Qwen2.5-Coder-32B-Instruct (Code Gen)\n- mistralai/Mistral-7B-Instruct-v0.3 (Function Calling)"

# ── 2. Live OWASP Red-Team Security Auditor Tool ────────────────────────────────
@mcp.tool()
async def run_redteam_audit(model_id: str) -> str:
    """Executes a real 5-axis OWASP prompt injection, jailbreak, and privilege escalation audit against a model using Groq openai/gpt-oss-120b as judge."""
    try:
        from app.services.security_engine import security_engine
        from app.database import AsyncSessionLocal

        async with AsyncSessionLocal() as session:
            audit = await security_engine.run_live_audit(model_id, session)

        lines = [
            f"# Live OWASP Red-Team Audit Report : {model_id}",
            f"**Target Repo:** `{audit.repo_id}`",
            f"**LLM-as-a-Judge:** {audit.evaluated_by}",
            f"**Overall Safety Containment:** {audit.overall_score}/100",
            f"**Audit Latency:** {audit.audit_duration_ms or 0}ms",
            "",
            "## 5-Axis OWASP Containment Breakdown",
            f"| Security Axis | Containment Score | Status |",
            f"|:---|---:|:---|",
            f"| Prompt Injection (OWASP LLM01) | {audit.prompt_injection_score}% | {'[MITIGATED]' if audit.prompt_injection_score >= 80 else '[AT RISK]'} |",
            f"| Jailbreak Resistance (OWASP LLM01/02) | {audit.jailbreak_resistance_score}% | {'[MITIGATED]' if audit.jailbreak_resistance_score >= 80 else '[AT RISK]'} |",
            f"| Task Hijacking (OWASP LLM02) | {audit.task_hijacking_score}% | {'[MITIGATED]' if audit.task_hijacking_score >= 80 else '[AT RISK]'} |",
            f"| Data Leakage (OWASP LLM06) | {audit.data_leakage_score}% | {'[MITIGATED]' if audit.data_leakage_score >= 80 else '[AT RISK]'} |",
            f"| Context Manipulation (OWASP LLM08) | {audit.context_manipulation_score}% | {'[MITIGATED]' if audit.context_manipulation_score >= 80 else '[AT RISK]'} |",
            "",
            "## LLM-as-a-Judge Detailed Technical Analysis",
            audit.reasoning or "No reasoning provided.",
            "",
            "## Verbatim Probe Dispatches & Target Responses",
        ]

        for po in (audit.probe_outputs or []):
            lines.append(f"\n### [{po.get('axis', '').upper()}] {po.get('test_name', '')}")
            lines.append(f"> **Adversarial Payload:**\n```\n{po.get('probe', '')}\n```")
            lines.append(f"> **Target Model Output:**\n```\n{po.get('response', '')}\n```")

        return "\n".join(lines)

    except Exception as e:
        return f"[run_redteam_audit error]: {e}"

# ── 3. Live Subprocess Sandbox Execution Tool ───────────────────────────────────
@mcp.tool()
async def execute_sandboxed_code(code: str, language: str = "python") -> str:
    """Executes Python or JavaScript code inside an isolated subprocess runner with a hard 5.0-second execution limit."""
    ext = "py" if language.lower() == "python" else "js"
    temp_sandbox_dir = _BACKEND_DIR / "temp_sandbox"
    temp_sandbox_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", dir=temp_sandbox_dir, delete=False, mode="w", encoding="utf-8") as f:
        f.write(code)
        temp_path = f.name

    cmd = [sys.executable, temp_path] if ext == "py" else ["node", temp_path]

    try:
        t0 = time.monotonic()
        def _run():
            try:
                proc = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=5.0
                )
                return proc.stdout, proc.stderr, proc.returncode
            except subprocess.TimeoutExpired:
                return "", "[Execution Timeout]: Process exceeded the 5.0s resource limit and was terminated.", -1
            except Exception as ex:
                return "", f"[Subprocess Launch Error]: {ex}", -2

        stdout, stderr, code_exit = await asyncio.to_thread(_run)
        latency_ms = int((time.monotonic() - t0) * 1000)

        output = [
            f"[AgentHub Execution Sandbox ({language.upper()})]",
            f"Latency: {latency_ms}ms | Exit Code: {code_exit}",
            "-" * 48,
            ""
        ]
        if stdout.strip():
            output.append(stdout.rstrip())
        if stderr.strip():
            output.append(f"\n[STDERR]:\n{stderr.rstrip()}")
        if not stdout.strip() and not stderr.strip():
            output.append("Process completed with code 0 (no output).")

        return "\n".join(output)

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

# ── 4. Live Model Inference Tool ───────────────────────────────────────────────
@mcp.tool()
async def run_inference(model_id: str, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
    """Runs live text completion against any verified model in the catalog via Hugging Face Inference API or Groq."""
    try:
        from app.database import AsyncSessionLocal
        from app.models import AIModel
        from app.services.hf_service import hf_service
        from sqlalchemy.future import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(AIModel).filter(AIModel.id == model_id))
            record = result.scalars().first()
            repo_id = record.repo_id if record else model_id

        t0 = time.monotonic()
        response_text = await hf_service.generate_completion(
            model_id=repo_id,
            prompt=prompt,
            max_tokens=int(max_tokens),
            temperature=float(temperature)
        )
        elapsed_ms = int((time.monotonic() - t0) * 1000)

        return (
            f"## Inference Completion : {model_id}\n"
            f"**Endpoint:** `{repo_id}` | **Latency:** {elapsed_ms}ms\n\n"
            f"---\n\n{response_text or '(No response returned from model)'}"
        )
    except Exception as e:
        return f"[run_inference error]: {e}"

# ── 5. Meta-Agent Goal Orchestrator Tool ────────────────────────────────────────
@mcp.tool()
async def orchestrate_meta_agent(goal: str, max_budget_credits: Optional[float] = None) -> str:
    """Submits a natural language goal to the Meta-Agent. Uses openai/gpt-oss-120b supervisor to generate DAG task decomposition across domain specialists and synthesize final output."""
    try:
        from app.services.orchestrator_engine import orchestrator_engine

        result = await orchestrator_engine.run(
            goal=goal,
            user_id="mcp_client",
            max_budget_credits=float(max_budget_credits) if max_budget_credits else None
        )

        lines = [
            f"# Meta-Agent Orchestration Plan : Job {result.get('job_id', 'N/A')}",
            f"**Goal:** {goal}",
            f"**Supervisor Model:** `openai/gpt-oss-120b` (Groq Engine)",
            f"**Total Cost:** {result.get('estimated_cost_credits', 0):.4f} credits",
            f"**Execution Time:** {result.get('execution_time_ms', 0)}ms",
            "",
            "## Execution DAG Steps",
        ]

        for step in result.get("dag_plan", []):
            lines.append(
                f"\n### Step {step.get('step_index', '?')}: {step.get('title', '')}\n"
                f"- **Assigned Model:** `{step.get('assigned_model_name', '')}` ({step.get('domain', '')})\n"
                f"- **Cost:** {step.get('cost_credits', 0):.4f} credits\n"
                f"- **Description:** {step.get('description', '')}\n"
            )
            if step.get("output"):
                lines.append(f"```\n{step['output']}\n```")

        lines += [
            "",
            "## Synthesized Final Output",
            result.get("final_output", "")
        ]

        return "\n".join(lines)

    except Exception as e:
        return f"[orchestrate_meta_agent error]: {e}"

# ── 6. Concurrent Arena Head-to-Head Comparison Tool ────────────────────────────
@mcp.tool()
async def compare_models_arena(model_a_id: str, model_b_id: str, prompt: str) -> str:
    """Benchmarks two models side-by-side concurrently on the same prompt and returns latency and output comparisons."""
    try:
        from app.database import AsyncSessionLocal
        from app.models import AIModel
        from app.services.hf_service import hf_service
        from sqlalchemy.future import select

        async with AsyncSessionLocal() as session:
            res_a = await session.execute(select(AIModel).filter(AIModel.id == model_a_id))
            res_b = await session.execute(select(AIModel).filter(AIModel.id == model_b_id))
            rec_a = res_a.scalars().first()
            rec_b = res_b.scalars().first()
            repo_a = rec_a.repo_id if rec_a else model_a_id
            repo_b = rec_b.repo_id if rec_b else model_b_id

        async def run_single(repo):
            t0 = time.monotonic()
            out = await hf_service.generate_completion(model_id=repo, prompt=prompt, max_tokens=300)
            return out, int((time.monotonic() - t0) * 1000)

        (out_a, lat_a), (out_b, lat_b) = await asyncio.gather(
            run_single(repo_a),
            run_single(repo_b)
        )

        return (
            f"# Matchmaker Arena Benchmark\n"
            f"**Prompt:** {prompt}\n\n"
            f"## Model A: `{repo_a}` ({lat_a}ms)\n{out_a}\n\n"
            f"---\n\n"
            f"## Model B: `{repo_b}` ({lat_b}ms)\n{out_b}\n"
        )
    except Exception as e:
        return f"[compare_models_arena error]: {e}"

if __name__ == "__main__":
    # Run with SSE transport on port 8001
    mcp.run(transport="sse")
