"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Server,
  Copy,
  Check,
  Key,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  Terminal,
  Activity,
  Box,
  FileJson,
  Workflow
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";

const MCP_TOOLS = [
  {
    name: "list_marketplace_models",
    category: "DISCOVERY & CATALOG",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Queries the live SQLite catalog of 51+ foundation models with real-time pricing, domain specialization, and OWASP audit scores.",
    params: "domain: Optional[str] (e.g. 'code', 'medical', 'finance', 'general')",
    returns: "List[ModelSummary] with pricing, context windows, and creator revenue shares"
  },
  {
    name: "recommend_optimal_model",
    category: "AI ORCHESTRATION",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Evaluates workload requirements, budget constraints, and latency goals to recommend top best-fit foundation models.",
    params: "task_description: str, budget_preference: str, latency_priority: str",
    returns: "Ranked list of top 3 recommended models with reasoning scores"
  },
  {
    name: "orchestrate_meta_agent",
    category: "MULTI-MODEL PIPELINE",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Decomposes complex natural language goals into a multi-model DAG pipeline across domain specialists and synthesizes unified output.",
    params: "goal: str, max_budget_credits: Optional[float]",
    returns: "Orchestration DAG with step-by-step execution metrics, latency, and tokens"
  },
  {
    name: "run_redteam_audit",
    category: "SECURITY & OWASP",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    description: "Executes 5-axis OWASP red-team adversarial penetration tests (prompt injection, jailbreak, task hijacking, data leakage) with LLM-as-a-Judge scoring.",
    params: "model_id: str",
    returns: "OWASP scores across 5 axes and vulnerability classification report"
  },
  {
    name: "compare_models_arena",
    category: "BENCHMARKING",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Benchmarks two models head-to-head concurrently on the same prompt measuring latency, token throughput, and response quality.",
    params: "model_a_id: str, model_b_id: str, prompt: str",
    returns: "Head-to-head metrics: wall-clock latency (ms), tokens/sec, and side-by-side outputs"
  },
  {
    name: "run_inference",
    category: "EXECUTION & GATEWAY",
    badgeColor: "bg-orange-50 text-[#FF4500] border-orange-200",
    description: "Runs live inference completion against a registered or catalog model endpoint with automatic token metering and credit deduction.",
    params: "model_id: str, prompt: str, max_tokens: int, temperature: float",
    returns: "Inference completion text, tokens consumed, latency, and ledger transaction ID"
  },
  {
    name: "execute_sandboxed_code",
    category: "DEVELOPER TOOLS",
    badgeColor: "bg-zinc-100 text-zinc-800 border-zinc-300",
    description: "Executes Python code in an isolated environment against live model endpoints with hard execution timeouts and resource caps.",
    params: "code: str, language: str (default 'python')",
    returns: "Execution stdout, stderr, exit code, session ID, and duration ms"
  }
];

export default function DeploymentsPage() {
  const [mcpConfigCopied, setMcpConfigCopied] = useState(false);
  const [sseUrlCopied, setSseUrlCopied]       = useState(false);
  const [activeFilter, setActiveFilter]       = useState<string>("ALL");

  const handleCopyMcpConfig = () => {
    const config = JSON.stringify({
      mcpServers: {
        agenthub: {
          command: "python",
          args: [
            "C:\\Users\\<USER_NAME>\\<PROJECT_FOLDER>\\backend\\mcp_server.py",
            "--transport",
            "stdio"
          ]
        }
      }
    }, null, 2);
    navigator.clipboard.writeText(config);
    setMcpConfigCopied(true);
    setTimeout(() => setMcpConfigCopied(false), 2000);
  };

  const handleCopySseUrl = () => {
    navigator.clipboard.writeText("http://localhost:8001/sse");
    setSseUrlCopied(true);
    setTimeout(() => setSseUrlCopied(false), 2000);
  };

  const filteredTools = activeFilter === "ALL"
    ? MCP_TOOLS
    : MCP_TOOLS.filter(t => t.category.includes(activeFilter));

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF4500] selection:text-white">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">
        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-black text-white font-mono text-[10px] font-bold uppercase tracking-widest">
                MODEL_CONTEXT_PROTOCOL_HUB
              </span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
                // Autonomous Agent MCP Infrastructure
              </span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              model context protocol (mcp).
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-2xl">
              Equip Claude Desktop, Cursor IDE, or custom agent frameworks with full autonomous access to the AgentHub multi-model foundation catalog.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/creator"
              className="px-4 py-2 bg-black text-white hover:bg-[#FF4500] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish in Creator Studio</span>
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 border border-black/20 hover:border-black font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>API Keys &amp; Playground</span>
            </Link>
          </div>
        </div>

        {/* ── Top Grid: MCP Server Transports & Client Setup ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Card 1: Remote SSE Server Status */}
          <div className="border border-black p-6 bg-white flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#FF4500]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Remote MCP Server // Server-Sent Events (SSE)
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  PORT 8001 LIVE
                </span>
              </div>

              <p className="text-xs font-sans text-black/75 leading-relaxed">
                AgentHub runs a high-performance Model Context Protocol server exposing all marketplace endpoints over SSE. Connect remote agents or development environments over standard HTTP streaming.
              </p>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-black/50 uppercase font-bold">
                  SSE Connection Endpoint:
                </div>
                <div className="p-3 bg-[#09090B] text-white font-mono text-xs flex items-center justify-between">
                  <span className="text-[#10B981]">http://localhost:8001/sse</span>
                  <button
                    onClick={handleCopySseUrl}
                    className="px-2 py-1 bg-white/10 hover:bg-[#FF4500] text-white text-[10px] font-mono uppercase flex items-center gap-1 transition-colors"
                  >
                    {sseUrlCopied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{sseUrlCopied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 bg-black/[0.02] border border-black/5">
                <span className="text-black/40 text-[9px] block uppercase">PROTOCOL VERSION</span>
                <strong className="text-black">MCP Specification 2024-11-05</strong>
              </div>
              <div className="p-2.5 bg-black/[0.02] border border-black/5">
                <span className="text-black/40 text-[9px] block uppercase">TRANSPORTS SUPPORTED</span>
                <strong className="text-black">stdio / sse (JSON-RPC 2.0)</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Claude Desktop & Cursor Configuration */}
          <div className="border border-black p-6 bg-black/[0.02] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-black" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Claude Desktop / Cursor IDE Config
                  </span>
                </div>
                <button
                  onClick={handleCopyMcpConfig}
                  className="px-3.5 py-1.5 bg-black text-white hover:bg-[#FF4500] font-sans text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-sm rounded-sm active:scale-[0.98]"
                >
                  {mcpConfigCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{mcpConfigCopied ? "Copied to Clipboard" : "Copy JSON Config"}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-[#09090B] text-white text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-zinc-800">
{`{
  "mcpServers": {
    "agenthub": {
      "command": "python",
      "args": [
        "C:\\\\Users\\\\<USER_NAME>\\\\<PROJECT_FOLDER>\\\\backend\\\\mcp_server.py",
        "--transport",
        "stdio"
      ]
    }
  }
}`}
              </pre>
            </div>

            <div className="p-3 bg-white border border-black/10 text-[11px] font-mono text-black/70 space-y-1">
              <div className="text-[10px] font-bold uppercase text-black">Installation Path:</div>
              <div>• <strong>Claude Desktop:</strong> <code className="bg-black/5 px-1 py-0.5 text-[10px]">%APPDATA%\Claude\claude_desktop_config.json</code></div>
              <div>• <strong>Cursor IDE:</strong> Settings &gt; Features &gt; MCP &gt; Add Server</div>
            </div>
          </div>
        </div>

        {/* ── MCP Tool Suite Section ── */}
        <div className="border border-black p-8 bg-white space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF4500]" />
                <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-black">
                  Active MCP Tool Suite (7 Registered Autonomous Tools)
                </h2>
              </div>
              <p className="text-xs font-sans text-black/60 mt-1">
                These tools are registered and exposed over standard JSON-RPC 2.0. Claude or any MCP-enabled assistant can call them directly in conversation.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {["ALL", "DISCOVERY", "ORCHESTRATION", "SECURITY", "BENCHMARKING", "EXECUTION"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    activeFilter === filter
                      ? "bg-black text-white"
                      : "bg-black/5 hover:bg-black/10 text-black/60 hover:text-black"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool, idx) => (
              <div
                key={idx}
                className="p-5 border border-black/10 bg-white hover:border-black transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 border text-[9px] font-mono font-bold uppercase tracking-wider ${tool.badgeColor}`}>
                      {tool.category}
                    </span>
                    <span className="text-[10px] font-mono text-black/30 group-hover:text-[#FF4500] transition-colors">
                      TOOL #{idx + 1}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-extrabold text-black flex items-center gap-1.5 pt-1">
                    <span className="text-[#FF4500]">●</span>
                    <code className="text-black bg-black/5 px-1.5 py-0.5">{tool.name}()</code>
                  </div>

                  <p className="text-xs font-sans text-black/75 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-black/10 space-y-1.5 text-[10px] font-mono text-black/60">
                  <div>
                    <span className="text-black/40 font-bold uppercase block text-[9px]">PARAMETERS</span>
                    <code className="text-black/80">{tool.params}</code>
                  </div>
                  <div>
                    <span className="text-black/40 font-bold uppercase block text-[9px]">RETURNS</span>
                    <span className="text-black/80">{tool.returns}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3-Step Setup Quickstart Guide ── */}
        <div className="mt-10 border border-black p-8 bg-black/[0.015] space-y-6">
          <div className="border-b border-black/10 pb-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Workflow className="w-4 h-4 text-black" />
              <span>3-Step Autonomous Agent Setup Workflow</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white border border-black/10 space-y-2">
              <div className="w-6 h-6 bg-black text-white font-mono text-xs font-bold flex items-center justify-center">
                1
              </div>
              <h4 className="font-mono text-xs font-bold uppercase text-black">Copy Config to Claude</h4>
              <p className="text-xs font-sans text-black/70 leading-relaxed">
                Click &quot;Copy JSON Config&quot; above and add the configuration block to your Claude Desktop or Cursor configuration file.
              </p>
            </div>

            <div className="p-4 bg-white border border-black/10 space-y-2">
              <div className="w-6 h-6 bg-black text-white font-mono text-xs font-bold flex items-center justify-center">
                2
              </div>
              <h4 className="font-mono text-xs font-bold uppercase text-black">Restart Host Client</h4>
              <p className="text-xs font-sans text-black/70 leading-relaxed">
                Restart Claude Desktop or reload Cursor. The hammer tool icon will appear with 7 AgentHub tools loaded.
              </p>
            </div>

            <div className="p-4 bg-white border border-black/10 space-y-2">
              <div className="w-6 h-6 bg-black text-white font-mono text-xs font-bold flex items-center justify-center">
                3
              </div>
              <h4 className="font-mono text-xs font-bold uppercase text-black">Prompt Naturally</h4>
              <p className="text-xs font-sans text-black/70 leading-relaxed">
                Ask Claude to &quot;Benchmark Llama 3 vs DeepSeek Coder&quot; or &quot;Audit BioMistral against OWASP vulnerabilities&quot; and watch it invoke the tools automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}