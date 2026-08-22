"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Play,
  Copy,
  Check,
  Key,
  Layers,
  Sparkles,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileCode,
  RotateCcw,
  Loader2,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  Plus,
  Boxes,
  Cpu,
  RefreshCw,
  ArrowRight,
  Sliders
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { executeSandboxSnippet } from "@/lib/api";

// Dynamically load Monaco Editor with zero-SSR hydration issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] bg-black text-white/50 flex flex-col items-center justify-center gap-3 font-mono text-xs">
      <Loader2 className="w-5 h-5 animate-spin text-[#FF4500]" />
      <span>[ INITIALIZING_MONACO_SDK_CANVAS ]</span>
    </div>
  ),
});

const CODE_TEMPLATES = {
  python: (model: string) => `import agenthub

# Initialize AgentHub client
client = agenthub.Client(api_key="your_agenthub_api_key")

# Stream inference from deployed open-weight model
response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Analyze system telemetry and optimize token throughput."}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`,

  curl: (model: string) => `curl -X POST "http://localhost:8000/api/models/${model}/stream" \\
  -H "Authorization: Bearer your_agenthub_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Analyze system telemetry and optimize token throughput.",
    "max_tokens": 512,
    "stream": true
  }'`,

  javascript: (model: string) => `import { AgentHub } from "@agenthub/sdk";

const client = new AgentHub({ apiKey: "your_agenthub_api_key" });

async function run() {
  const stream = await client.models.stream({
    modelId: "${model}",
    prompt: "Analyze system telemetry and optimize token throughput."
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.token);
  }
}

run();`
};

const MCP_TOOLS = [
  {
    name: "list_marketplace_models",
    description: "Queries the live SQLite catalog of 51+ foundation models with real-time pricing and OWASP scores.",
    params: "domain: Optional[str]"
  },
  {
    name: "recommend_optimal_model",
    description: "Evaluates workload requirements, budget constraints, and latency goals to recommend top best-fit models.",
    params: "task_description: str, budget_preference: str, latency_priority: str"
  },
  {
    name: "orchestrate_meta_agent",
    description: "Decomposes goals into a multi-model DAG pipeline across domain specialists and synthesizes output.",
    params: "goal: str, max_budget_credits: Optional[float]"
  },
  {
    name: "run_redteam_audit",
    description: "Executes 5-axis OWASP red-team adversarial penetration tests with LLM-as-a-Judge scoring.",
    params: "model_id: str"
  },
  {
    name: "compare_models_arena",
    description: "Benchmarks two models head-to-head concurrently on the same prompt measuring latency and token throughput.",
    params: "model_a_id: str, model_b_id: str, prompt: str"
  },
  {
    name: "run_inference",
    description: "Runs live inference completion against a registered or catalog model endpoint.",
    params: "model_id: str, prompt: str, max_tokens: int, temperature: float"
  },
  {
    name: "execute_sandboxed_code",
    description: "Executes Python code in an isolated sandbox runner against live GPU clusters.",
    params: "code: str, language: str"
  }
];

export default function DeploymentsPage() {
  const [activeTab, setActiveTab]         = useState<"mcp" | "sandbox" | "proxy">("mcp");
  const [language, setLanguage]           = useState<"python" | "curl" | "javascript">("python");
  const [selectedModel, setSelectedModel] = useState("llama3-8b-instruct");
  const [copied, setCopied]               = useState(false);
  const [mcpConfigCopied, setMcpConfigCopied] = useState(false);

  // Two-way interactive code state for Monaco Editor
  const [customCode, setCustomCode]       = useState<string>(() => CODE_TEMPLATES.python("llama3-8b-instruct"));

  // Execution Runner State
  const [executing, setExecuting]         = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [execMetrics, setExecMetrics]     = useState<any>(null);

  // Registered Endpoints List State
  const [registeredList, setRegisteredList] = useState<any[]>([]);
  const [loadingList, setLoadingList]       = useState(false);

  // Proxy Test State
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>("");
  const [testPrompt, setTestPrompt]       = useState("Write an idiomatic Python async function with type hints and error handling.");
  const [testingProxy, setTestingProxy]   = useState(false);
  const [proxyOutput, setProxyOutput]     = useState<any>(null);
  const [proxyError, setProxyError]       = useState<string | null>(null);

  useEffect(() => {
    loadRegisteredEndpoints();
  }, []);

  const loadRegisteredEndpoints = async () => {
    setLoadingList(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/registry/endpoints");
      if (res.ok) {
        const data = await res.json();
        setRegisteredList(data);
        if (data.length > 0 && !selectedEndpointId) {
          setSelectedEndpointId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load registered endpoints", e);
    } finally {
      setLoadingList(false);
    }
  };

  const handleLanguageChange = (newLang: "python" | "curl" | "javascript") => {
    setLanguage(newLang);
    setCustomCode(CODE_TEMPLATES[newLang](selectedModel));
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    setCustomCode(CODE_TEMPLATES[language](newModel));
  };

  const handleResetTemplate = () => {
    setCustomCode(CODE_TEMPLATES[language](selectedModel));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMcpConfig = () => {
    const config = JSON.stringify({
      mcpServers: {
        agenthub: {
          command: "C:\\Users\\Tharun R Gowda\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
          args: [
            "C:\\Users\\Tharun R Gowda\\Desktop\\codefury\\backend\\mcp_server.py",
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

  const handleRunCode = async () => {
    setExecuting(true);
    setTerminalOutput(null);
    try {
      const res = await executeSandboxSnippet(language, customCode, selectedModel, "demo_key");
      setTerminalOutput(res.output);
      setExecMetrics(res);
    } catch (e) {
      console.error(e);
      setTerminalOutput("Error executing snippet in sandbox. Check connection to localhost:8000.");
    } finally {
      setExecuting(false);
    }
  };

  const handleTestProxy = async () => {
    if (!testPrompt.trim()) return;
    const epId = selectedEndpointId || "llama3-8b-instruct";
    setTestingProxy(true);
    setProxyOutput(null);
    setProxyError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/registry/proxy-inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint_id: epId,
          prompt: testPrompt,
          max_tokens: 400,
          temperature: 0.3,
          user_id: "usr_guest_demo",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Proxy returned HTTP ${res.status}`);
      }

      setProxyOutput(data);
      await loadRegisteredEndpoints();
    } catch (err: any) {
      setProxyError(err.message || "Proxy inference execution failed.");
    } finally {
      setTestingProxy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF4500] selection:text-white">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">
        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-black text-white font-mono text-[10px] font-bold uppercase tracking-widest">
                DEVELOPER_INFRASTRUCTURE_&_MCP_HUB
              </span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
                // Model Context Protocol, SDK Canvas & Live Gateway
              </span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              deployments & mcp hub.
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-2xl">
              Connect autonomous agents via MCP or execute code against the unified foundation model marketplace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/creator"
              className="px-4 py-2 bg-black text-white hover:bg-[#FF4500] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Model in Creator Studio</span>
            </Link>
            <Link
              href="/profile"
              className="px-4 py-2 border border-black/20 hover:border-black font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>API Keys in Profile</span>
            </Link>
          </div>
        </div>

        {/* ── Primary Navigation Tabs ── */}
        <div className="flex items-center gap-2 mb-8 border-b border-black/15">
          <button
            onClick={() => setActiveTab("mcp")}
            className={`px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "mcp"
                ? "border-black text-black bg-black/[0.02]"
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <Server className="w-4 h-4 text-[#FF4500]" />
            <span>1. Model Context Protocol (MCP) Server</span>
          </button>

          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "sandbox"
                ? "border-black text-black bg-black/[0.02]"
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <Code2 className="w-4 h-4 text-black" />
            <span>2. Monaco SDK Code Canvas & Runner</span>
          </button>

          <button
            onClick={() => setActiveTab("proxy")}
            className={`px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "proxy"
                ? "border-black text-black bg-black/[0.02]"
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <Globe className="w-4 h-4 text-black" />
            <span>3. Live Gateway Proxy & Active Endpoints</span>
          </button>
        </div>

        {/* ── TAB 1: MODEL CONTEXT PROTOCOL (MCP) SERVER HUB ── */}
        {activeTab === "mcp" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Cards: MCP Endpoints and Claude Config */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card 1: Remote SSE MCP Server */}
              <div className="border border-black p-6 bg-white space-y-4">
                <div className="flex items-center gap-2 border-b border-black/10 pb-3">
                  <Server className="w-4 h-4 text-[#FF4500]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider">
                    Remote MCP Server // Server-Sent Events (SSE)
                  </span>
                </div>
                <p className="text-xs font-sans text-black/70 leading-relaxed">
                  AgentHub runs a high-throughput Model Context Protocol (MCP) server over SSE.
                  Connect Claude Desktop, Cursor IDE, or custom agent frameworks to control marketplace models autonomously.
                </p>
                <div className="p-3 bg-black text-white font-mono text-xs select-all flex items-center justify-between">
                  <span>http://localhost:8001/sse</span>
                  <span className="text-[10px] text-[#10B981] font-bold">LIVE (PORT 8001)</span>
                </div>
                <div className="text-[11px] font-mono text-black/60">
                  Default Transport: <code className="bg-black/5 px-1.5 py-0.5">stdio</code> for local subprocesses or <code className="bg-black/5 px-1.5 py-0.5">sse</code> for remote network agents.
                </div>
              </div>

              {/* Card 2: Claude Desktop Configuration */}
              <div className="border border-black p-6 bg-black/[0.02] space-y-4">
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-black" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      Claude Desktop / Cursor Config
                    </span>
                  </div>
                  <button
                    onClick={handleCopyMcpConfig}
                    className="px-2.5 py-1 bg-black text-white hover:bg-[#FF4500] font-mono text-[10px] font-bold uppercase flex items-center gap-1"
                  >
                    {mcpConfigCopied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{mcpConfigCopied ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="p-3.5 bg-black text-white text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
{`{
  "mcpServers": {
    "agenthub": {
      "command": "C:\\\\Users\\\\Tharun R Gowda\\\\AppData\\\\Local\\\\Programs\\\\Python\\\\Python311\\\\python.exe",
      "args": [
        "C:\\\\Users\\\\Tharun R Gowda\\\\Desktop\\\\codefury\\\\backend\\\\mcp_server.py",
        "--transport",
        "stdio"
      ]
    }
  }
}`}
                </pre>
                <div className="text-[10px] font-mono text-black/50">
                  Paste into: <code className="bg-black/5 px-1 py-0.5">%APPDATA%\\Claude\\claude_desktop_config.json</code>
                </div>
              </div>
            </div>

            {/* Bottom: Live MCP Tool Directory */}
            <div className="border border-black p-6 bg-white space-y-5">
              <div className="border-b border-black/10 pb-3">
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF4500]" />
                  <span>Active MCP Tool Suite (7 Registered Platform Tools)</span>
                </div>
                <p className="text-xs font-sans text-black/60 mt-0.5">
                  These tools are exposed over standard JSON-RPC 2.0 to any AI assistant executing via MCP.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MCP_TOOLS.map((tool, idx) => (
                  <div key={idx} className="p-4 border border-black/10 bg-black/[0.015] space-y-2 hover:border-black transition-colors">
                    <div className="font-mono text-xs font-bold text-black flex items-center gap-1.5">
                      <span className="text-[#FF4500]">●</span>
                      <span>{tool.name}()</span>
                    </div>
                    <p className="text-[11px] font-sans text-black/75 leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="pt-2 border-t border-black/10 font-mono text-[9px] text-black/50 truncate">
                      Args: {tool.params}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MONACO SDK CODE CANVAS & RUNNER ── */}
        {activeTab === "sandbox" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Controls Strip */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center border border-black/10 bg-black/[0.015] p-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-black/50 font-bold uppercase tracking-wider text-[10px]">TARGET_MODEL:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="bg-white border border-black/15 px-3 py-1.5 text-xs font-mono font-bold text-black uppercase outline-none focus:border-black"
                >
                  <option value="llama3-8b-instruct">Llama 3 8B Instruct</option>
                  <option value="deepseek-coder-67b-instruct">DeepSeek Coder 6.7B</option>
                  <option value="biomedlm-2-7b">BioMistral 7B Medical</option>
                  <option value="fingpt-forecaster-llama2">FinGPT Forecaster</option>
                  <option value="mistral-7b-instruct">Mistral 7B Instruct</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                {(["python", "curl", "javascript"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                      language === lang
                        ? "bg-black text-white"
                        : "bg-white border border-black/10 text-black/50 hover:text-black hover:border-black"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Monaco Editor & Sandbox Output Console */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
              {/* Left: Monaco Editor */}
              <div className="border border-black/10 bg-[#09090B] overflow-hidden relative z-10">
                <div className="flex items-center justify-between px-5 py-3 bg-[#121214] border-b border-zinc-800 text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-zinc-200 font-bold uppercase text-[10px]">
                      sandbox.{language === "python" ? "py" : language === "curl" ? "sh" : "ts"}
                    </span>
                    <span className="text-[9px] text-[#10B981] ml-2 font-mono">
                      [ EDITABLE_CANVAS ]
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetTemplate}
                      title="Reset to initial template"
                      className="px-2.5 py-1 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 text-zinc-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase"
                    >
                      {copied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={executing}
                      className="bg-[#FF4500] text-white px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-[#E03E00] transition-colors flex items-center gap-1.5 disabled:opacity-40"
                    >
                      {executing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-white" />
                          <span>Run Snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative w-full h-[380px] bg-[#09090B]">
                  <MonacoEditor
                    height="380px"
                    language={language === "python" ? "python" : language === "curl" ? "shell" : "javascript"}
                    value={customCode}
                    onChange={(val) => setCustomCode(val || "")}
                    theme="vs-dark"
                    options={{
                      readOnly: false,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      wordWrap: "on",
                      automaticLayout: true,
                      tabSize: 4,
                    }}
                  />
                </div>
              </div>

              {/* Right: Sandbox Console */}
              <div className="border border-black/10 bg-white p-6">
                <div className="flex items-center justify-between pb-3 border-b border-black/10 mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-black" />
                    <span className="font-mono text-xs font-bold text-black uppercase tracking-widest">
                      SANDBOX_EXECUTION_CONSOLE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#10B981] font-bold">
                    GPU_CLUSTER: 100% OK
                  </span>
                </div>

                {terminalOutput ? (
                  <div className="space-y-4">
                    <pre className="bg-black text-white p-5 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">
                      {terminalOutput}
                    </pre>

                    {execMetrics && (
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-black/10 text-xs font-mono">
                        <div className="bg-black/[0.02] p-3 border border-black/10">
                          <span className="text-[9px] text-black/40 uppercase block">EXECUTION LATENCY</span>
                          <strong className="text-black">{execMetrics.execution_time_ms}ms</strong>
                        </div>
                        <div className="bg-black/[0.02] p-3 border border-black/10">
                          <span className="text-[9px] text-black/40 uppercase block">TOKENS CONSUMED</span>
                          <strong className="text-black">{execMetrics.tokens_used}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-black/40 bg-black/[0.015] border border-dashed border-black/15 uppercase">
                    Modify code in the editor and click &quot;Run Snippet&quot; to execute with the embedded AgentHub SDK.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: LIVE GATEWAY PROXY & ACTIVE ENDPOINTS ── */}
        {activeTab === "proxy" && (
          <div className="space-y-8 animate-in fade-in duration-300 w-full">
            {/* Creator Studio Navigation Banner */}
            <div className="p-6 bg-black/[0.02] border border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#FF4500]" />
                  <span>Publish Models in Creator Studio</span>
                </div>
                <p className="text-xs text-black/70 font-sans max-w-2xl">
                  Model registration and publishing is unified directly inside Creator Studio. Publish your verified Hugging Face repository or custom cloud endpoint to receive an automated 80% royalty revenue split on all token inferences.
                </p>
              </div>
              <Link
                href="/creator"
                className="px-5 py-2.5 bg-black text-white hover:bg-[#FF4500] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shrink-0 shadow-sm"
              >
                <span>Open Creator Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Live Gateway Proxy Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
              {/* Left: Test Controls */}
              <div className="w-full border border-black p-6 bg-white space-y-5">
                <div className="border-b border-black/10 pb-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FF4500]" />
                    <span>Live Gateway Proxy Testing</span>
                  </div>
                  <p className="text-[11px] text-black/60 font-sans mt-0.5">
                    Dispatch live prompts through AgentHub&apos;s intelligent gateway to measure real-time latency and token metering.
                  </p>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                    Select Target Registered Endpoint:
                  </label>
                  <select
                    value={selectedEndpointId}
                    onChange={(e) => setSelectedEndpointId(e.target.value)}
                    className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                  >
                    {registeredList.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.model_name} ({ep.id}) · {ep.domain} · ${ep.price_per_1k_tokens}/1k
                      </option>
                    ))}
                    <option value="llama3-8b-instruct">Llama 3 8B Instruct (Mesh Default)</option>
                    <option value="deepseek-coder-67b-instruct">DeepSeek Coder 67B (Mesh Default)</option>
                    <option value="qwen25-coder-32b-instruct">Qwen 2.5 Coder 32B (Mesh Default)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                    Test Prompt:
                  </label>
                  <textarea
                    rows={4}
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-sans text-xs text-black"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestProxy}
                  disabled={testingProxy}
                  className="w-full py-3 bg-black text-white hover:bg-[#FF4500] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  {testingProxy ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Routing Request via Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Execute Proxy Inference</span>
                    </>
                  )}
                </button>

                {proxyError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{proxyError}</span>
                  </div>
                )}
              </div>

              {/* Right: Telemetry & Results */}
              <div className="w-full border border-black p-6 bg-black/[0.02] space-y-5">
                <div className="border-b border-black/10 pb-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                    <span>Gateway Telemetry & Response</span>
                  </div>
                </div>

                {proxyOutput ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div className="p-2.5 bg-white border border-black/10">
                        <div className="text-[9px] text-black/40 uppercase">Real Latency</div>
                        <div className="font-bold text-black">{proxyOutput.latency_ms}ms</div>
                      </div>
                      <div className="p-2.5 bg-white border border-black/10">
                        <div className="text-[9px] text-black/40 uppercase">Tokens Metered</div>
                        <div className="font-bold text-black">{proxyOutput.tokens_metered}</div>
                      </div>
                      <div className="p-2.5 bg-white border border-black/10">
                        <div className="text-[9px] text-black/40 uppercase">Settled Credits</div>
                        <div className="font-bold text-black">{proxyOutput.cost_credits}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-black text-white border border-black">
                      <div className="font-mono text-[9px] text-[#FF4500] uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
                        <span>Gateway Response ({proxyOutput.routing_mode}):</span>
                        <span className="text-white/40">{proxyOutput.model_name}</span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                        {proxyOutput.response}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-black/40 bg-white border border-dashed border-black/15 uppercase">
                    Select an endpoint on the left and click &quot;Execute Proxy Inference&quot; to inspect live round-trip telemetry.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Active Registered Endpoints Table */}
            <div className="border border-black p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-black" />
                  <span>Active Registered Endpoints in Gateway</span>
                </div>
                <button
                  onClick={loadRegisteredEndpoints}
                  className="text-[10px] font-mono text-black/60 hover:text-black flex items-center gap-1 uppercase"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingList ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {registeredList.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-black/40 bg-black/[0.01] border border-dashed border-black/15 uppercase">
                  No custom external endpoints registered yet. Publish your models in Creator Studio!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border border-black/10">
                    <thead className="bg-black text-white text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Endpoint ID</th>
                        <th className="p-2.5">Model Name</th>
                        <th className="p-2.5">Domain</th>
                        <th className="p-2.5">P50 Latency</th>
                        <th className="p-2.5">Price / 1k</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {registeredList.map((ep) => (
                        <tr key={ep.id} className="hover:bg-black/[0.02]">
                          <td className="p-2.5 font-bold">{ep.id}</td>
                          <td className="p-2.5 font-sans font-bold text-black">{ep.model_name}</td>
                          <td className="p-2.5">{ep.domain}</td>
                          <td className="p-2.5">{ep.p50_latency_ms}ms</td>
                          <td className="p-2.5">${ep.price_per_1k_tokens}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold">
                              {ep.verification_status || "ONLINE"}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => {
                                setSelectedEndpointId(ep.id);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-2.5 py-1 bg-black text-white hover:bg-[#FF4500] text-[9px] font-bold uppercase"
                            >
                              Test Proxy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}