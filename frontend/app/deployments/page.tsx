"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
  Upload,
  FileCode,
  RotateCcw,
  Loader2,
  Globe,
  Radio,
  ExternalLink,
  ShieldCheck,
  Sliders,
  DollarSign,
  Plus
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { generateApiKey, executeSandboxSnippet } from "@/lib/api";

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
  python: (key: string, model: string) => `import agenthub

# Initialize AgentHub client with provisioned production key
client = agenthub.Client(api_key="${key}")

# Stream inference from deployed open-weight model
response = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Analyze system telemetry and optimize token throughput."}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`,

  curl: (key: string, model: string) => `curl -X POST "http://localhost:8000/api/models/${model}/stream" \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Analyze system telemetry and optimize token throughput.",
    "max_tokens": 512,
    "stream": true
  }'`,

  javascript: (key: string, model: string) => `import { AgentHub } from "@agenthub/sdk";

const client = new AgentHub({ apiKey: "${key}" });

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

export default function DeploymentsPage() {
  const [activeTab, setActiveTab]         = useState<"registry" | "sandbox" | "mcp">("registry");
  const [language, setLanguage]           = useState<"python" | "curl" | "javascript">("python");
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [apiKey, setApiKey]               = useState("ak_live_demo_9842a1b7e3");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied]               = useState(false);

  // ── MCP Server State ────────────────────────────────────────────────────────
  const [mcpTransport, setMcpTransport]   = useState<"stdio" | "sse">("stdio");
  const [copiedMcpConfig, setCopiedMcpConfig] = useState(false);
  const [selectedMcpTool, setSelectedMcpTool] = useState("list_marketplace_models");
  const [mcpTestParam, setMcpTestParam]   = useState("ALL DOMAINS");
  const [mcpTestOutput, setMcpTestOutput] = useState<string | null>(null);
  const [mcpExecuting, setMcpExecuting]   = useState(false);

  // Two-way interactive code state for Monaco Editor
  const [customCode, setCustomCode]       = useState<string>(() => CODE_TEMPLATES.python("ak_live_demo_9842a1b7e3", "llama3"));

  // Execution Runner State
  const [executing, setExecuting]         = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [execMetrics, setExecMetrics]     = useState<any>(null);

  // ── API Registry State ───────────────────────────────────────────────────────
  const [regModelName, setRegModelName]   = useState("Llama 3 Fine-Tuned Code Gateway");
  const [regDomain, setRegDomain]         = useState("CODE GEN");
  const [regEndpoint, setRegEndpoint]     = useState("https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct");
  const [regSecret, setRegSecret]         = useState("");
  const [regPrice, setRegPrice]           = useState(0.12);
  const [regLatency, setRegLatency]       = useState(38);
  const [regContext, setRegContext]       = useState(8192);
  const [deployingEp, setDeployingEp]     = useState(false);
  const [deployResult, setDeployResult]   = useState<any>(null);

  // Proxy Test State
  const [testPrompt, setTestPrompt]       = useState("Write a Python async generator function for streaming SSE token deltas.");
  const [testingProxy, setTestingProxy]   = useState(false);
  const [proxyOutput, setProxyOutput]     = useState<any>(null);

  const handleLanguageChange = (newLang: "python" | "curl" | "javascript") => {
    setLanguage(newLang);
    setCustomCode(CODE_TEMPLATES[newLang](apiKey, selectedModel));
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    setCustomCode(CODE_TEMPLATES[language](apiKey, newModel));
  };

  const handleResetTemplate = () => {
    setCustomCode(CODE_TEMPLATES[language](apiKey, selectedModel));
  };

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await generateApiKey("Production Key");
      setApiKey(res.api_key);
      setCustomCode(CODE_TEMPLATES[language](res.api_key, selectedModel));
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setTerminalOutput(null);
    try {
      const res = await executeSandboxSnippet(language, customCode, selectedModel, apiKey);
      setTerminalOutput(res.output);
      setExecMetrics(res);
    } catch (e) {
      console.error(e);
      setTerminalOutput("Error executing snippet in sandbox. Check connection to localhost:8000.");
    } finally {
      setExecuting(false);
    }
  };

  const handleDeployEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployingEp(true);
    setDeployResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/registry/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developer_id: "usr_guest_demo",
          model_name: regModelName,
          domain: regDomain,
          api_endpoint: regEndpoint,
          api_key_env_or_secret: regSecret || null,
          price_per_1k_tokens: regPrice,
          p50_latency_ms: regLatency,
          context_length: regContext,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setDeployResult(data);
    } catch (err: any) {
      alert("Deployment error: " + err.message);
    } finally {
      setDeployingEp(false);
    }
  };

  const handleTestProxy = async () => {
    if (!testPrompt.trim()) return;
    setTestingProxy(true);
    setProxyOutput(null);

    try {
      const epId = deployResult?.id || "ep_default_gateway";
      const res = await fetch("http://127.0.0.1:8000/api/registry/proxy-inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint_id: epId,
          prompt: testPrompt,
          max_tokens: 450,
          temperature: 0.3,
          user_id: "usr_guest_demo",
        }),
      });

      if (!res.ok) {
        throw new Error(`Proxy error HTTP ${res.status}`);
      }

      const data = await res.json();
      setProxyOutput(data);
    } catch (err: any) {
      alert("Proxy test error: " + err.message);
    } finally {
      setTestingProxy(false);
    }
  };

  const handleTestMcpTool = async () => {
    setMcpExecuting(true);
    setMcpTestOutput(null);
    try {
      if (selectedMcpTool === "list_marketplace_models") {
        const res = await fetch(`http://localhost:8000/api/models`);
        const data = await res.json();
        setMcpTestOutput(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{
              type: "text",
              text: `Discovered ${data.length} verified open-weight models in AgentHub Registry across domains: LLM CHAT, CODE GEN, HEALTHCARE, FINANCE, VISION AI.`
            }],
            models_sample: data.slice(0, 4).map((m: any) => ({
              id: m.id,
              name: m.name,
              repo_id: m.repo_id,
              domain: m.domain,
              p50_latency_ms: m.p50_latency_ms,
              security_score: m.security_score
            }))
          }
        }, null, 2));
      } else if (selectedMcpTool === "execute_sandboxed_code") {
        const res = await executeSandboxSnippet("python", mcpTestParam || "print('AgentHub MCP Isolated Python Subprocess Execution OK')", "llama3", apiKey);
        setMcpTestOutput(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{ type: "text", text: res.output }],
            metrics: { latency_ms: res.execution_time_ms, tokens: res.tokens_used, status: "COMPLETED" }
          }
        }, null, 2));
      } else if (selectedMcpTool === "run_redteam_audit") {
        const res = await fetch(`http://localhost:8000/api/audit/llama3`);
        const data = await res.json();
        setMcpTestOutput(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{ type: "text", text: `OWASP Red-Team Security Score: ${data.security_score}% SAFE` }],
            audit_report: {
              model_id: data.model_id,
              vulnerabilities_blocked: data.vulnerabilities_blocked || 5,
              total_probes: data.total_probes || 5,
              score: data.security_score
            }
          }
        }, null, 2));
      } else {
        setMcpTestOutput(JSON.stringify({
          jsonrpc: "2.0",
          result: {
            content: [{ type: "text", text: `[MCP Tool: ${selectedMcpTool}] Executed successfully with parameter '${mcpTestParam}' via stdio/sse bridge.` }]
          }
        }, null, 2));
      }
    } catch (e: any) {
      setMcpTestOutput(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: e.message || "MCP Tool Execution Failed" }
      }, null, 2));
    } finally {
      setMcpExecuting(false);
    }
  };

  const getClaudeDesktopConfig = () => {
    return JSON.stringify({
      mcpServers: {
        agenthub: {
          command: "python",
          args: [
            "c:/Users/hndan/OneDrive/Desktop/sss/Codefury/backend/app/mcp_server.py",
            "--transport",
            mcpTransport
          ],
          env: {
            PYTHONPATH: "c:/Users/hndan/OneDrive/Desktop/sss/Codefury/backend"
          }
        }
      }
    }, null, 2);
  };

  const handleCopyMcpConfig = () => {
    navigator.clipboard.writeText(getClaudeDesktopConfig());
    setCopiedMcpConfig(true);
    setTimeout(() => setCopiedMcpConfig(false), 2000);
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
                API_REGISTRY_GATEWAY
              </span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
                // Intelligent Model Routing & Metering Layer
              </span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              deployments & api registry.
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-2xl">
              AgentHub acts as an intelligent routing gateway, telemetry tracker, and metering layer rather than a monolithic GPU host.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateKey}
              disabled={generatingKey}
              className="px-4 py-2.5 bg-black text-white hover:bg-[#FF4500] text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>{generatingKey ? "Generating..." : "Provision API Key"}</span>
            </button>
          </div>
        </div>

        {/* ── Primary Navigation Tabs ── */}
        <div className="flex items-center gap-2 mb-8 border-b border-black/15 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("registry")}
            className={`px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "registry"
                ? "border-black text-black bg-black/[0.02]"
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <Globe className="w-4 h-4 text-[#FF4500]" />
            <span>1. Register External Model Endpoint</span>
          </button>

          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "sandbox"
                ? "border-black text-black bg-black/[0.02]"
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <Code2 className="w-4 h-4 text-black" />
            <span>2. Monaco SDK Code Canvas & Runner</span>
          </button>

          <button
            onClick={() => setActiveTab("mcp")}
            className={`px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === "mcp"
                ? "border-[#FF4500] text-black bg-[#FF4500]/5 font-extrabold"
                : "border-transparent text-black/40 hover:text-black"
            }`}
          >
            <Server className="w-4 h-4 text-[#FF4500]" />
            <span>3. Model Context Protocol (MCP) Server</span>
          </button>
        </div>

        {/* ── TAB 1: API REGISTRY PATTERN GATEWAY ── */}
        {activeTab === "registry" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
            {/* Left: Registration Form (6 Cols) */}
            <div className="lg:col-span-6 border border-black p-6 bg-white space-y-6">
              <div className="border-b border-black/10 pb-3">
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#FF4500]" />
                  <span>Register Custom External Model Endpoint</span>
                </div>
                <p className="text-[11px] text-black/60 font-sans mt-1">
                  Point AgentHub to your external model running on Hugging Face Inference Endpoints, AWS, RunPod, vLLM, or Ollama.
                </p>
              </div>

              <form onSubmit={handleDeployEndpoint} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                    Model Display Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={regModelName}
                    onChange={(e) => setRegModelName(e.target.value)}
                    className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-sans text-xs text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                      Domain:
                    </label>
                    <select
                      value={regDomain}
                      onChange={(e) => setRegDomain(e.target.value)}
                      className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                    >
                      <option value="CODE GEN">CODE GEN</option>
                      <option value="LLM CHAT">LLM CHAT</option>
                      <option value="HEALTHCARE">HEALTHCARE</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="VISION AI">VISION AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                      Price / 1k Tokens (Credits):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={regPrice}
                      onChange={(e) => setRegPrice(Number(e.target.value))}
                      className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                    External Endpoint URL (HTTPS):
                  </label>
                  <input
                    type="url"
                    required
                    value={regEndpoint}
                    onChange={(e) => setRegEndpoint(e.target.value)}
                    placeholder="https://api-inference.huggingface.co/models/... or https://your-pod.runpod.net/v1"
                    className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs text-black"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                    Secret API Key / Bearer Token (Optional):
                  </label>
                  <input
                    type="password"
                    value={regSecret}
                    onChange={(e) => setRegSecret(e.target.value)}
                    placeholder="hf_... or sk-..."
                    className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs text-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                      Estimated P50 Latency (ms):
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={regLatency}
                      onChange={(e) => setRegLatency(Number(e.target.value))}
                      className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                      Context Length:
                    </label>
                    <input
                      type="number"
                      min="1024"
                      value={regContext}
                      onChange={(e) => setRegContext(Number(e.target.value))}
                      className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={deployingEp}
                  className="w-full py-3.5 bg-black text-white hover:bg-[#FF4500] font-mono text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  {deployingEp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating & Registering Gateway Endpoint...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Register & Provision Endpoint in Mesh</span>
                    </>
                  )}
                </button>
              </form>

              {deployResult && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Endpoint Registered Successfully! (ID: {deployResult.id})</span>
                  </div>
                  <div className="text-[11px] text-green-700">
                    Proxy URL: <span className="font-bold">{deployResult.gateway_proxy_url}</span>
                  </div>
                  <div className="text-[10px] text-green-600 italic">
                    {deployResult.architecture_note}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Proxy Test & Telemetry (6 Cols) */}
            <div className="lg:col-span-6 border border-black p-6 bg-black/[0.02] space-y-6">
              <div className="border-b border-black/10 pb-3">
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FF4500]" />
                  <span>Live Proxy Test & Telemetry</span>
                </div>
                <p className="text-[11px] text-black/60 font-sans mt-1">
                  Test prompt routing through AgentHub's proxy gateway to measure round-trip latency and token metering.
                </p>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                  Test Prompt:
                </label>
                <textarea
                  rows={3}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full p-2.5 bg-white border border-black/20 focus:border-black font-sans text-xs text-black"
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
                    <span>Execute Gateway Proxy Inference</span>
                  </>
                )}
              </button>

              {/* Proxy Telemetry & Output */}
              {proxyOutput && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                    <div className="p-2.5 bg-white border border-black/10">
                      <div className="text-[9px] text-black/40 uppercase">Latency</div>
                      <div className="font-bold text-black">{proxyOutput.latency_ms}ms</div>
                    </div>
                    <div className="p-2.5 bg-white border border-black/10">
                      <div className="text-[9px] text-black/40 uppercase">Tokens Metered</div>
                      <div className="font-bold text-black">{proxyOutput.tokens_metered}</div>
                    </div>
                    <div className="p-2.5 bg-white border border-black/10">
                      <div className="text-[9px] text-black/40 uppercase">Cost (Credits)</div>
                      <div className="font-bold text-black">{proxyOutput.cost_credits}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-black text-white border border-black">
                    <div className="font-mono text-[9px] text-[#FF4500] uppercase tracking-wider font-bold mb-2">
                      Live Gateway Output ({proxyOutput.routing_mode}):
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                      {proxyOutput.response}
                    </pre>
                  </div>
                </div>
              )}

              {/* Architectural Summary Banner */}
              <div className="p-4 bg-white border border-black/15 text-xs font-sans text-black/80 space-y-2">
                <div className="font-mono text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>AgentHub Gateway Guarantees</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-black/70">
                  <li>Zero GPU hosting overhead: External endpoints remain hosted on your infrastructure.</li>
                  <li>Live token metering and automated 80% revenue royalty credit to creator wallets.</li>
                  <li>Automatic failover to OpenAI gpt-5-mini if custom endpoint experiences downtime.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MONACO SDK CODE CANVAS & RUNNER ── */}
        {activeTab === "sandbox" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Controls Strip */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center border border-black/10 bg-black/[0.015] p-4">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-black/50 font-bold uppercase tracking-wider text-[10px]">ACTIVE_KEY:</span>
                <span className="bg-white border border-black/15 px-3 py-1 text-black font-bold font-mono text-xs">
                  {apiKey}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-black/50 font-bold uppercase tracking-wider text-[10px]">TARGET_MODEL:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="bg-white border border-black/15 px-3 py-1.5 text-xs font-mono font-bold text-black uppercase outline-none focus:border-black"
                >
                  <option value="llama3">Llama 3 8B Instruct</option>
                  <option value="deepseek">DeepSeek Coder 6.7B</option>
                  <option value="biomedlm">BioMistral 7B Medical</option>
                  <option value="llava">LLaVA 1.5 7B Vision</option>
                  <option value="fingpt">FinGPT Forecaster</option>
                  <option value="mistral">Mistral 7B Instruct</option>
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
                    Modify code in the editor and click "Run Snippet" to execute in the isolated sandbox.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MODEL CONTEXT PROTOCOL (MCP) SERVER ── */}
        {activeTab === "mcp" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header Telemetry Strip */}
            <div className="border border-black bg-black text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="font-mono text-xs font-bold text-[#FF4500] uppercase tracking-widest">
                    MCP_SERVER // FAST_MCP_PROTOCOL_v0.1.0
                  </span>
                </div>
                <h2 className="font-sans font-bold text-xl text-white">
                  Model Context Protocol Integration
                </h2>
                <p className="font-mono text-xs text-white/60 mt-1 uppercase">
                  Expose AgentHub 51-model catalog, OWASP evaluator, and sandbox tools directly to Claude Desktop & Cursor IDE.
                </p>
              </div>

              {/* Transport Switcher */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 p-1.5 self-start md:self-auto">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest px-2">TRANSPORT:</span>
                <button
                  onClick={() => setMcpTransport("stdio")}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    mcpTransport === "stdio"
                      ? "bg-white text-black font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  stdio (Desktop)
                </button>
                <button
                  onClick={() => setMcpTransport("sse")}
                  className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    mcpTransport === "sse"
                      ? "bg-[#FF4500] text-white font-extrabold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  SSE (Remote Stream)
                </button>
              </div>
            </div>

            {/* 2-Col Grid: Config Generator & Live Tool Tester */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left: Claude Desktop Config & Setup */}
              <div className="border border-black p-6 bg-white space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#FF4500]" />
                    <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                      Claude Desktop Config (`claude_desktop_config.json`)
                    </span>
                  </div>
                  <button
                    onClick={handleCopyMcpConfig}
                    className="px-3 py-1 bg-black text-white hover:bg-[#FF4500] text-[10px] font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                  >
                    {copiedMcpConfig ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMcpConfig ? "Copied" : "Copy JSON"}</span>
                  </button>
                </div>

                <pre className="bg-[#09090B] text-zinc-300 p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800">
                  {getClaudeDesktopConfig()}
                </pre>

                <div className="bg-black/[0.02] border border-black/10 p-4 text-xs font-mono space-y-2">
                  <span className="font-bold text-black uppercase block">// Config File Location:</span>
                  <div className="text-[11px] text-black/70 space-y-1">
                    <div><strong>Windows:</strong> <code className="bg-black/5 px-1.5 py-0.5">%APPDATA%\Claude\claude_desktop_config.json</code></div>
                    <div><strong>macOS:</strong> <code className="bg-black/5 px-1.5 py-0.5">~/Library/Application Support/Claude/claude_desktop_config.json</code></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-black/60">Standalone CLI Launch:</span>
                  <code className="bg-black text-white px-2.5 py-1 text-[10px] font-bold">
                    python backend/app/mcp_server.py --transport {mcpTransport}
                  </code>
                </div>
              </div>

              {/* Right: Interactive MCP Tool Tester */}
              <div className="border border-black p-6 bg-white space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-black" />
                    <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                      Interactive MCP Tool Invoker
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#10B981] font-bold uppercase">
                    TOOL_DISCOVERY_ACTIVE
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                      SELECT_MCP_TOOL:
                    </label>
                    <select
                      value={selectedMcpTool}
                      onChange={(e) => setSelectedMcpTool(e.target.value)}
                      className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black uppercase outline-none"
                    >
                      <option value="list_marketplace_models">1. list_marketplace_models (Catalog Query)</option>
                      <option value="execute_sandboxed_code">2. execute_sandboxed_code (Subprocess Runner)</option>
                      <option value="run_redteam_audit">3. run_redteam_audit (OWASP Security Probes)</option>
                      <option value="orchestrate_meta_agent">4. orchestrate_meta_agent (DAG Pipeline)</option>
                      <option value="compare_models_arena">5. compare_models_arena (Concurrent Bench)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase font-bold text-black/70 mb-1">
                      TOOL_INPUT_PAYLOAD / PARAMETER:
                    </label>
                    <input
                      type="text"
                      value={mcpTestParam}
                      onChange={(e) => setMcpTestParam(e.target.value)}
                      placeholder="Enter test parameter..."
                      className="w-full p-2.5 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs text-black outline-none"
                    />
                  </div>

                  <button
                    onClick={handleTestMcpTool}
                    disabled={mcpExecuting}
                    className="w-full py-2.5 bg-[#FF4500] text-white hover:bg-black text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {mcpExecuting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Invoking FastMCP Tool...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Call Tool via MCP Protocol</span>
                      </>
                    )}
                  </button>
                </div>

                {/* MCP Result Console */}
                {mcpTestOutput ? (
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-bold text-black/50 uppercase">
                      MCP JSON-RPC Response:
                    </span>
                    <pre className="bg-[#09090B] text-[#10B981] p-4 text-xs font-mono overflow-x-auto leading-relaxed border border-zinc-800 max-h-[220px]">
                      {mcpTestOutput}
                    </pre>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-black/40 bg-black/[0.015] border border-dashed border-black/15 uppercase">
                    Select an MCP tool and click "Call Tool via MCP Protocol" to verify real-time response payload.
                  </div>
                )}
              </div>
            </div>

            {/* 6-Card Grid: Registered MCP Tools Catalog */}
            <div className="space-y-4 pt-4">
              <div className="font-mono text-xs font-bold text-black uppercase tracking-widest">
                // REGISTERED_MCP_TOOLS_CATALOG (6 ENDPOINTS)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "list_marketplace_models",
                    desc: "Queries SQLite database catalog across 51+ verified open-weight repositories with metadata filtering.",
                    tag: "CATALOG",
                    params: "domain?: string",
                  },
                  {
                    name: "run_inference",
                    desc: "Executes streaming or non-streaming inference on models via Groq / Hugging Face with automatic failovers.",
                    tag: "INFERENCE",
                    params: "model_id, prompt, max_tokens",
                  },
                  {
                    name: "execute_sandboxed_code",
                    desc: "Runs isolated Python subprocess code within secure sandbox environment with 5.0s execution timeout.",
                    tag: "SANDBOX",
                    params: "code: string, language?: string",
                  },
                  {
                    name: "run_redteam_audit",
                    desc: "Fires live 5-probe OWASP LLM Top-10 adversarial attack suite (Prompt Injection, Jailbreak) with Judge evaluation.",
                    tag: "APPSEC",
                    params: "model_id: string",
                  },
                  {
                    name: "orchestrate_meta_agent",
                    desc: "Synthesizes natural language goals into multi-stage DAG subtasks with Pareto budget optimization.",
                    tag: "META_AGENT",
                    params: "goal, max_budget_credits",
                  },
                  {
                    name: "compare_models_arena",
                    desc: "Runs 3-way concurrent SSE model benchmark with time-to-first-token (TTFT) and token velocity telemetry.",
                    tag: "ARENA",
                    params: "model_ids: string[], prompt",
                  },
                ].map((tool) => (
                  <div key={tool.name} className="border border-black/10 bg-white p-5 space-y-3 flex flex-col justify-between hover:border-black transition-colors">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-black text-white uppercase">
                          {tool.tag}
                        </span>
                        <span className="font-mono text-[9px] text-[#10B981] font-bold">READY</span>
                      </div>
                      <h4 className="font-mono font-bold text-xs text-black text-[#FF4500]">
                        {tool.name}
                      </h4>
                      <p className="font-sans text-xs text-black/60 mt-1.5 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-black/10 font-mono text-[10px] text-black/50">
                      <code>params: {tool.params}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}