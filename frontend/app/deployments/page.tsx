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
  Loader2
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
  const [language, setLanguage]           = useState<"python" | "curl" | "javascript">("python");
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [apiKey, setApiKey]               = useState("ak_live_demo_9842a1b7e3");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied]               = useState(false);

  // Two-way interactive code state for Monaco Editor
  const [customCode, setCustomCode]       = useState<string>(() => CODE_TEMPLATES.python("ak_live_demo_9842a1b7e3", "llama3"));

  // Execution Runner State
  const [executing, setExecuting]         = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [execMetrics, setExecMetrics]     = useState<any>(null);

  // Artifact Upload State
  const [uploading, setUploading]         = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Update default code snippet when language, key, or model changes if unmodified
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model_name", file.name);
      formData.append("domain", "CODE_GEN");
      formData.append("user_id", "usr_guest_demo");

      const res = await fetch("http://localhost:8000/api/models/upload-artifact", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(`Deployed ${file.name} to endpoint: ${data.endpoint_url}`);
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-mono bg-black text-white font-bold">SDK_SANDBOX_v2</span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">// Interactive Code-to-Deploy Canvas & MCP Interface</span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              deployments & code canvas.
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-xl">
              Write, edit, and test custom Python scripts in the isolated sandbox runner against live GPU clusters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="btn-outline text-[10px] font-mono font-bold uppercase tracking-wider py-2.5 px-4 cursor-pointer flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{uploading ? "Uploading..." : "Deploy Artifact (.pkl, .py, .onnx)"}</span>
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pkl,.onnx,.py,.bin" />
            </label>
            <button
              onClick={handleGenerateKey}
              disabled={generatingKey}
              className="btn-solid-black text-[10px] font-mono font-bold uppercase tracking-wider py-2.5 px-4 flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>{generatingKey ? "Generating..." : "Provision API Key"}</span>
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#DCFCE7] text-xs font-mono text-[#166534] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* ── Controls Strip ── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-center mb-6 border border-black/10 bg-black/[0.015] p-4">
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

        {/* ── Interactive Monaco Code Canvas & Execution Console ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">

          {/* Left: Monaco Editor Container */}
          <div className="border border-black/10 bg-[#09090B] overflow-hidden relative z-10">
            {/* Editor Top Bar */}
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

            {/* Monaco Editor Component with Two-Way State Binding */}
            <div className="relative w-full h-[380px] bg-[#09090B]">
              <MonacoEditor
                height="380px"
                language={language === "python" ? "python" : language === "curl" ? "shell" : "javascript"}
                value={customCode}
                onChange={(val) => setCustomCode(val || "")}
                theme="vs-dark"
                options={{
                  readOnly: false,
                  domReadOnly: false,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                  tabSize: 4,
                  cursorBlinking: "smooth",
                  renderLineHighlight: "all",
                }}
              />
            </div>
          </div>

          {/* Right: Sandbox Execution Console */}
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

            {/* Remote MCP Server Information Card */}
            <div className="mt-6 pt-6 border-t border-black/10">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-[#FF4500]" />
                <span className="font-mono text-[10px] font-bold text-black uppercase tracking-widest">
                  REMOTE_MCP_SERVER // SSE ENDPOINT
                </span>
              </div>
              <p className="text-[10px] font-mono text-black/60 uppercase leading-relaxed mb-3">
                AgentHub exposes an SSE-based Remote MCP Server on port 8001 for Claude Desktop, Cursor, and web clients.
              </p>
              <div className="p-3 bg-black/[0.02] border border-black/10 text-[11px] font-mono text-black select-all">
                http://localhost:8001/sse
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}