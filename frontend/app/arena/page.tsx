"use client";

import { useState, useEffect } from "react";
import {
  GitCompare, Play, Zap, Award, Layers,
  RefreshCw, ChevronDown, Search, CheckCircle2, Loader2
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";
import { fetchModels } from "@/lib/api";

const DOMAINS = ["ALL DOMAINS", "LLM CHAT", "CODE GEN", "VISION AI", "HEALTHCARE", "FINANCE"];

// ── Sub-component: Model picker dropdown for each Arena slot ───────────────────
function ModelPicker({
  label,
  accentColor,
  models,
  selectedId,
  onSelect,
}: {
  label: string;
  accentColor: string;
  models: any[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen]             = useState(false);
  const [domain, setDomain]         = useState("ALL DOMAINS");
  const [search, setSearch]         = useState("");

  const selectedModel = models.find(m => m.id === selectedId);

  const filtered = models.filter(m => {
    const domMatch = domain === "ALL DOMAINS" ||
      m.domain.replace("_", " ").toUpperCase() === domain;
    const srchMatch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.task_tag || "").toLowerCase().includes(search.toLowerCase());
    return domMatch && srchMatch;
  });

  return (
    <div className="relative">
      {/* Slot Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs font-bold" style={{ color: accentColor }}>
          {label}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-xs font-mono text-[#64748B] hover:text-black transition-colors"
        >
          <span className="truncate max-w-[120px]">{selectedModel?.name || "Select model"}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-[#E2E8F0] rounded-lg shadow-xl overflow-hidden" style={{ minWidth: 280 }}>
          {/* Domain tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-[#F1F5F9] overflow-x-auto scrollbar-none">
            {DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-2 py-0.5 text-[0.6rem] font-mono font-bold rounded whitespace-nowrap transition-all ${
                  domain === d ? "bg-black text-white" : "bg-[#F1F5F9] text-[#64748B] hover:text-black"
                }`}
              >
                {d === "ALL DOMAINS" ? "ALL" : d}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="p-2 border-b border-[#F1F5F9]">
            <div className="relative">
              <Search className="w-3 h-3 text-[#94A3B8] absolute left-2 top-2" />
              <input
                autoFocus
                type="text"
                placeholder="Search model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1 text-xs font-mono border border-[#E2E8F0] rounded bg-[#F8FAFC] outline-none focus:border-black"
              />
            </div>
          </div>
          {/* Model list */}
          <div className="max-h-52 overflow-y-auto divide-y divide-[#F8FAFC]">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs font-mono text-[#64748B] text-center">No models match</div>
            ) : filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 ${
                  selectedId === m.id ? "bg-[#F0FDF4]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-sans font-bold text-black truncate">{m.name}</div>
                  <div className="text-[0.6rem] font-mono text-[#64748B]">{m.task_tag} · {m.p50_latency_ms}ms</div>
                </div>
                {selectedId === m.id && <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Arena Page ────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const [models, setModels]   = useState<any[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  const [modelA, setModelA]   = useState("");
  const [modelB, setModelB]   = useState("");
  const [modelC, setModelC]   = useState("");
  const [prompt, setPrompt]   = useState("Explain the difference between supervised and unsupervised learning in 3 sentences.");

  const [streamA, setStreamA] = useState("");
  const [streamB, setStreamB] = useState("");
  const [streamC, setStreamC] = useState("");

  const [ttftA, setTtftA]     = useState<number | null>(null);
  const [ttftB, setTtftB]     = useState<number | null>(null);
  const [ttftC, setTtftC]     = useState<number | null>(null);

  const [tokensA, setTokensA] = useState(0);
  const [tokensB, setTokensB] = useState(0);
  const [tokensC, setTokensC] = useState(0);

  const [streaming, setStreaming]       = useState(false);
  const [votedWinner, setVotedWinner]   = useState<string | null>(null);

  const { user, deductCredits, fetchBalance } = useAuthContext();
  const userId = user?.id || "usr_guest_demo";

  // Load live model catalog
  useEffect(() => {
    fetchModels()
      .then((data: any[]) => {
        setModels(data || []);
        if (data?.length >= 3) {
          setModelA(data[0].id);
          setModelB(data[1].id);
          setModelC(data[2].id);
        }
      })
      .catch(console.error)
      .finally(() => setModelsLoading(false));
  }, []);

  const modelAObj = models.find(m => m.id === modelA);
  const modelBObj = models.find(m => m.id === modelB);
  const modelCObj = models.find(m => m.id === modelC);

  const handleStartArena = async () => {
    if (!prompt.trim() || streaming || !modelA || !modelB || !modelC) return;
    setStreaming(true);
    setStreamA(""); setStreamB(""); setStreamC("");
    setTtftA(null); setTtftB(null); setTtftC(null);
    setTokensA(0);  setTokensB(0);  setTokensC(0);
    setVotedWinner(null);

    const startTime = Date.now();
    try {
      const res = await fetch("http://localhost:8000/api/arena/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model_ids: [modelA, modelB, modelC], user_id: userId }),
      });
      if (!res.body) return;
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data    = JSON.parse(line.slice(6));
            const elapsed = Date.now() - startTime;
            const ttftVal = data.ttft_ms || elapsed;

            deductCredits(0.0003);

            if (data.model_id === modelA) {
              setStreamA(p => p + (data.token || ""));
              setTokensA(p => p + 1);
              setTtftA(p => p === null && (data.token || "").trim() ? ttftVal : p);
            } else if (data.model_id === modelB) {
              setStreamB(p => p + (data.token || ""));
              setTokensB(p => p + 1);
              setTtftB(p => p === null && (data.token || "").trim() ? ttftVal : p);
            } else if (data.model_id === modelC) {
              setStreamC(p => p + (data.token || ""));
              setTokensC(p => p + 1);
              setTtftC(p => p === null && (data.token || "").trim() ? ttftVal : p);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Arena stream error", e);
    } finally {
      setStreaming(false);
      fetchBalance();
    }
  };

  const handleVote = (modelId: string) => {
    setVotedWinner(modelId);
    fetch("http://localhost:8000/api/arena/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "arena_session", winner_model_id: modelId }),
    }).catch(console.error);
  };

  // Determine winner by token count
  const winnerTokens = Math.max(tokensA, tokensB, tokensC);

  const ArenaColumn = ({
    slot, modelId, modelObj, stream, ttft, tokens, accentColor,
  }: {
    slot: string; modelId: string; modelObj: any; stream: string;
    ttft: number | null; tokens: number; accentColor: string;
  }) => (
    <div className={`border bg-white rounded-lg flex flex-col overflow-hidden shadow-xs transition-all ${
      votedWinner === modelId ? "border-[#10B981] ring-2 ring-[#10B981]/20" : "border-[#E2E8F0]"
    }`}>
      {/* Card header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        {modelsLoading ? (
          <div className="h-8 bg-[#E2E8F0] animate-pulse rounded" />
        ) : (
          <ModelPicker
            label={slot}
            accentColor={accentColor}
            models={models}
            selectedId={modelId}
            onSelect={slot === "MODEL_A" ? setModelA : slot === "MODEL_B" ? setModelB : setModelC}
          />
        )}

        {/* Model metadata row */}
        {modelObj && (
          <div className="mt-2 flex items-center gap-3 text-[0.62rem] font-mono text-[#64748B] flex-wrap">
            <span className="px-1.5 py-0.5 bg-[#F1F5F9] rounded uppercase text-[0.58rem]">
              {modelObj.domain}
            </span>
            <span>{modelObj.task_tag}</span>
            <span className="ml-auto text-[0.65rem]" style={{ color: accentColor }}>
              TTFT: <strong>{ttft !== null ? `${ttft}ms` : streaming ? "—" : "—"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Streaming content */}
      <div className="flex-1 p-5 min-h-[240px] text-xs font-mono leading-relaxed text-[#09090B] whitespace-pre-wrap overflow-y-auto">
        {stream || (
          <span className="text-[#94A3B8]">
            {streaming ? "⏳ Waiting for first token..." : "Click 'Stream Benchmark' to start."}
          </span>
        )}
        {streaming && stream && (
          <span className="inline-block w-1.5 h-3 bg-black animate-pulse ml-0.5 align-middle" />
        )}
      </div>

      {/* Footer: telemetry + vote */}
      <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFAFA] flex items-center justify-between gap-3">
        <div className="font-mono text-[0.65rem] text-[#64748B] flex items-center gap-3">
          <span>TOKENS: <strong className="text-black">{tokens}</strong></span>
          {modelObj && (
            <span>P50: <strong className="text-black">{modelObj.p50_latency_ms}ms</strong></span>
          )}
        </div>
        <button
          onClick={() => handleVote(modelId)}
          disabled={streaming || (!streamA && !streamB && !streamC)}
          className={`px-3 py-1.5 rounded text-xs font-sans font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40 ${
            votedWinner === modelId
              ? "bg-[#10B981] text-white"
              : "bg-white border border-[#E2E8F0] text-black hover:border-black"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          {votedWinner === modelId ? "🏆 Winner" : "Vote Winner"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-mono bg-black text-white">ARENA_3_WAY_STREAM</span>
              <span className="font-mono text-xs text-[#64748B]">// Concurrent Model Benchmark · {models.length} models loaded</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              Model Matchmaker Arena
            </h1>
            <p className="text-sm text-[#64748B] mt-1 font-sans">
              Pick any 3 models from all 51 categories · Filter by domain · Stream concurrently · Vote the winner.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#64748B]">
              MODELS: <strong className="text-black">{models.length}</strong>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          </div>
        </div>

        {/* ── Prompt Box ── */}
        <div className="border border-[#E2E8F0] bg-white rounded-lg p-5 mb-6 shadow-xs">
          <label className="block text-xs font-mono uppercase text-[#64748B] font-semibold mb-2">
            BENCHMARK_PROMPT
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={2}
              className="flex-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-3 text-sm font-sans text-black outline-none focus:border-black transition-colors resize-none"
              placeholder="Enter your benchmark prompt..."
            />
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleStartArena}
                disabled={streaming || !modelA || !modelB || !modelC}
                className="btn-solid-black px-6 gap-2 disabled:opacity-50 flex-1"
              >
                {streaming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Streaming...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Stream Benchmark</span>
                  </>
                )}
              </button>
              {(streamA || streamB || streamC) && !streaming && (
                <button
                  onClick={() => {
                    setStreamA(""); setStreamB(""); setStreamC("");
                    setTtftA(null); setTtftB(null); setTtftC(null);
                    setTokensA(0);  setTokensB(0);  setTokensC(0);
                    setVotedWinner(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#E2E8F0] rounded-lg text-xs font-sans font-semibold text-[#64748B] hover:text-black hover:border-black transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Category-filtered quick-select strip ── */}
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg px-4 py-3 mb-6 flex items-center gap-3 overflow-x-auto scrollbar-none">
          <span className="font-mono text-[0.65rem] font-bold text-[#64748B] uppercase whitespace-nowrap">QUICK PICK:</span>
          {DOMAINS.slice(1).map(domain => {
            const domainModels = models.filter(m =>
              m.domain.replace("_", " ").toUpperCase() === domain
            );
            return (
              <button
                key={domain}
                onClick={() => {
                  if (domainModels.length >= 3) {
                    setModelA(domainModels[0].id);
                    setModelB(domainModels[1].id);
                    setModelC(domainModels[2].id);
                    setStreamA(""); setStreamB(""); setStreamC("");
                    setVotedWinner(null);
                  }
                }}
                disabled={domainModels.length < 3}
                title={`Load top 3 ${domain} models`}
                className="px-3 py-1.5 text-xs font-semibold font-sans rounded-md bg-white border border-[#E2E8F0] text-[#64748B] hover:text-black hover:border-black transition-all whitespace-nowrap disabled:opacity-40"
              >
                {domain} ({domainModels.length})
              </button>
            );
          })}
        </div>

        {/* ── 3-Way Split Arena ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ArenaColumn
            slot="MODEL_A" modelId={modelA} modelObj={modelAObj}
            stream={streamA} ttft={ttftA} tokens={tokensA} accentColor="#0284C7"
          />
          <ArenaColumn
            slot="MODEL_B" modelId={modelB} modelObj={modelBObj}
            stream={streamB} ttft={ttftB} tokens={tokensB} accentColor="#10B981"
          />
          <ArenaColumn
            slot="MODEL_C" modelId={modelC} modelObj={modelCObj}
            stream={streamC} ttft={ttftC} tokens={tokensC} accentColor="#F59E0B"
          />
        </div>

        {/* ── Post-benchmark comparison bar ── */}
        {!streaming && (streamA || streamB || streamC) && (
          <div className="mt-6 border border-[#E2E8F0] bg-white rounded-lg p-5 shadow-xs">
            <div className="text-xs font-mono font-bold text-black uppercase mb-4">
              BENCHMARK_RESULTS // TOKEN VELOCITY COMPARISON
            </div>
            <div className="space-y-3">
              {[
                { label: modelAObj?.name || modelA, tokens: tokensA, color: "#0284C7" },
                { label: modelBObj?.name || modelB, tokens: tokensB, color: "#10B981" },
                { label: modelCObj?.name || modelC, tokens: tokensC, color: "#F59E0B" },
              ].map(({ label, tokens, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-[#475569] truncate max-w-[200px]">{label}</span>
                    <span className="font-bold" style={{ color }}>{tokens} tokens</span>
                  </div>
                  <div className="h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${winnerTokens > 0 ? (tokens / winnerTokens) * 100 : 0}%`,
                        background: color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {votedWinner && (
              <div className="mt-4 pt-4 border-t border-[#F1F5F9] text-xs font-mono">
                <span className="text-[#64748B]">You voted: </span>
                <strong className="text-[#10B981]">
                  {models.find(m => m.id === votedWinner)?.name || votedWinner} 🏆
                </strong>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}