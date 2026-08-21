"use client";

import { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { generateApiKey, executeSandboxSnippet } from "@/lib/api";

const CODE_TEMPLATES = {
  python: (key: string, model: string) => `import agenthub

# Initialize AgentHub client with live production key
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
  const [language, setLanguage] = useState<"python" | "curl" | "javascript">("python");
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [apiKey, setApiKey] = useState("ak_live_demo_9842a1b7e3");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Execution Runner State
  const [executing, setExecuting] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [execMetrics, setExecMetrics] = useState<any>(null);

  const currentCode = CODE_TEMPLATES[language](apiKey, selectedModel);

  const handleGenerateKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await generateApiKey("Production Key");
      setApiKey(res.api_key);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setTerminalOutput(null);
    try {
      const res = await executeSandboxSnippet(language, currentCode, selectedModel, apiKey);
      setTerminalOutput(res.output);
      setExecMetrics(res);
    } catch (e) {
      console.error(e);
      setTerminalOutput("Error executing snippet. Check connection to localhost:8000.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-mono bg-black text-white font-bold">SDK_SANDBOX_v2</span>
              <span className="font-mono text-xs text-[#64748B]">// Live Code-to-Deploy Canvas</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              Deployments & Monaco Canvas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateKey}
              disabled={generatingKey}
              className="btn-outline text-xs font-semibold gap-1.5 py-2 px-3.5"
            >
              <Key className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>{generatingKey ? "Generating..." : "Provision New API Key"}</span>
            </button>
          </div>
        </div>

        {/* ── Controls Strip ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center mb-6 border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-lg">
          {/* Active Key Display */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#64748B]">ACTIVE_KEY:</span>
            <span className="bg-white border border-[#E2E8F0] px-2.5 py-1 rounded text-black font-bold">
              {apiKey}
            </span>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#64748B]">TARGET_MODEL:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded px-2.5 py-1 text-xs font-sans font-semibold text-black"
            >
              <option value="llama3">Llama 3 8B Instruct</option>
              <option value="deepseek">DeepSeek Coder 6.7B</option>
              <option value="biomedlm">BioMistral 7B Medical</option>
              <option value="llava">LLaVA 1.5 7B Vision</option>
              <option value="fingpt">FinGPT Forecaster</option>
              <option value="mistral">Mistral 7B Instruct</option>
            </select>
          </div>

          {/* Language Tabs */}
          <div className="flex items-center gap-1">
            {(["python", "curl", "javascript"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 text-xs font-mono uppercase rounded transition-all ${
                  language === lang
                    ? "bg-black text-white font-bold"
                    : "text-[#64748B] hover:text-black"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Monaco Code Canvas & Execution Output ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">

          {/* Code Editor Box */}
          <div className="border border-[#E2E8F0] bg-[#09090B] rounded-lg overflow-hidden shadow-md">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181B] border-b border-zinc-800 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 text-zinc-300">
                  sandbox.{language === "python" ? "py" : language === "curl" ? "sh" : "ts"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2 py-1 hover:text-white transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={handleRunCode}
                  disabled={executing}
                  className="bg-white text-black px-3 py-1 rounded text-xs font-sans font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-black" />
                  <span>{executing ? "Running..." : "Run Snippet"}</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <pre className="p-5 text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {currentCode}
            </pre>
          </div>

          {/* Terminal Console Output */}
          <div className="border border-[#E2E8F0] bg-white rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-black" />
                <span className="font-mono text-xs font-bold text-black uppercase">
                  SANDBOX_EXECUTION_CONSOLE
                </span>
              </div>
              <span className="text-xs font-mono text-[#10B981]">
                GPU_CLUSTER: 100% OK
              </span>
            </div>

            {terminalOutput ? (
              <div className="space-y-4">
                <pre className="bg-[#09090B] text-zinc-200 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {terminalOutput}
                </pre>

                {execMetrics && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F1F5F9] text-xs font-mono">
                    <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                      <span className="text-[0.62rem] text-[#64748B] block">LATENCY</span>
                      <strong className="text-black">{execMetrics.execution_time_ms}ms</strong>
                    </div>
                    <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                      <span className="text-[0.62rem] text-[#64748B] block">TOKENS USED</span>
                      <strong className="text-black">{execMetrics.tokens_used}</strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-mono text-[#64748B] bg-[#F8FAFC] rounded-lg border border-dashed border-[#E2E8F0]">
                Click "Run Snippet" to execute code against the live cluster sandbox.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}