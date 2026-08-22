"use client";

import { useState, useEffect } from "react";
import {
  GitCompare, Play, Zap, Award, Layers,
  RefreshCw, ChevronDown, Search, CheckCircle2, Loader2,
  Activity, ArrowRight, Trophy
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";
import { fetchModels, getApiBaseUrl } from "@/lib/api";

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
  const [open, setOpen]     = useState(false);
  const [domain, setDomain] = useState("ALL DOMAINS");
  const [search, setSearch] = useState("");

  const selectedModel = models.find(m => m.id === selectedId);

  const filtered = models.filter(m => {
    const domMatch = domain === "ALL DOMAINS" ||
      (m.domain || "").replace("_", " ").toUpperCase() === domain;
    const srchMatch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.task_tag || "").toLowerCase().includes(search.toLowerCase());
    return domMatch && srchMatch;
  });

  return (
    <div className="relative">
      {/* Slot Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>
          {label}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs font-mono text-black/60 hover:text-black transition-colors"
        >
          <span className="truncate max-w-[140px] font-bold">{selectedModel?.name || "Select model"}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-black/15 shadow-2xl overflow-hidden" style={{ minWidth: 280 }}>
          {/* Domain tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-black/10 overflow-x-auto scrollbar-none bg-black/[0.02]">
            {DOMAINS.map(d => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  domain === d ? "bg-black text-white" : "bg-white text-black/50 hover:text-black border border-black/10"
                }`}
              >
                {d === "ALL DOMAINS" ? "ALL" : d}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="p-2 border-b border-black/10">
            <div className="relative">
              <Search className="w-3 h-3 text-black/40 absolute left-2.5 top-2.5" />
              <input
                autoFocus
                type="text"
                placeholder="SEARCH MODEL..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs font-mono border border-black/15 bg-black/[0.015] uppercase tracking-wider outline-none focus:border-black"
              />
            </div>
          </div>
          {/* Model list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-black/5">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs font-mono text-black/40 text-center">No models match</div>
            ) : filtered.map(m => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3.5 py-2.5 hover:bg-black/[0.02] transition-colors flex items-center gap-2 ${
                  selectedId === m.id ? "bg-black/[0.04]" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-sans font-bold text-black truncate">{m.name}</div>
                  <div className="text-[10px] font-mono text-black/50">{m.task_tag} · {m.p50_latency_ms || 38}ms</div>
                </div>
                {selectedId === m.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const userId = user?.id || "usr_demo";

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
      const res = await fetch(`${getApiBaseUrl()}/arena/stream`, {
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
    fetch(`${getApiBaseUrl()}/arena/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "arena_session", winner_model_id: modelId }),
    }).catch(console.error);
  };

  const winnerTokens = Math.max(tokensA, tokensB, tokensC);

  const ArenaColumn = ({
    slot, modelId, modelObj, stream, ttft, tokens, accentColor,
  }: {
    slot: string; modelId: string; modelObj: any; stream: string;
    ttft: number | null; tokens: number; accentColor: string;
  }) => (
    <div className={`border bg-white flex flex-col overflow-hidden transition-all ${
      votedWinner === modelId ? "border-[#FF4500] ring-1 ring-[#FF4500]" : "border-black/10"
    }`}>
      {/* Card header */}
      <div className="p-4 border-b border-black/10 bg-black/[0.02]">
        {modelsLoading ? (
          <div className="h-8 bg-black/5 animate-pulse" />
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
          <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-black/50 flex-wrap">
            <span className="px-2 py-0.5 bg-black/[0.04] border border-black/10 text-black uppercase">
              {modelObj.domain}
            </span>
            <span>{modelObj.task_tag}</span>
            <span className="ml-auto font-bold text-black">
              TTFT: {ttft !== null ? `${ttft}ms` : streaming ? "..." : "—"}
            </span>
          </div>
        )}
      </div>

      {/* Streaming content */}
      <div className="flex-1 p-5 min-h-[260px] text-xs font-mono leading-relaxed text-black whitespace-pre-wrap overflow-y-auto">
        {stream || (
          <span className="text-black/30">
            {streaming ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black/40" />
                <span>Waiting for initial token...</span>
              </span>
            ) : (
              "Click 'Stream Benchmark' to start."
            )}
          </span>
        )}
        {streaming && stream && (
          <span className="inline-block w-1.5 h-3 bg-[#FF4500] animate-pulse ml-0.5 align-middle" />
        )}
      </div>

      {/* Footer: telemetry + vote */}
      <div className="p-4 border-t border-black/10 bg-black/[0.015] flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] text-black/60 flex items-center gap-3">
          <span>TOKENS: <strong className="text-black">{tokens}</strong></span>
          {modelObj && (
            <span>P50: <strong className="text-black">{modelObj.p50_latency_ms || 38}ms</strong></span>
          )}
        </div>
        <button
          onClick={() => handleVote(modelId)}
          disabled={streaming || (!streamA && !streamB && !streamC)}
          className={`px-3 py-1.5 text-[10px] font-sans font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-sm disabled:opacity-30 ${
            votedWinner === modelId
              ? "bg-[#FF4500] text-white"
              : "bg-white border border-black/15 text-black hover:border-black hover:bg-black hover:text-white"
          }`}
        >
          {votedWinner === modelId ? <Trophy className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
          <span>{votedWinner === modelId ? "Winner" : "Vote"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-mono bg-black text-white">ARENA_3_WAY_STREAM</span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">// Concurrent Inference Telemetry</span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              matchmaker arena.
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-xl">
              Benchmark 3 models concurrently with distinct domain personas streamed via Groq LPU in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-black/60">
            <span>CATALOG: <strong className="text-black">{models.length} MODELS</strong></span>
            <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
          </div>
        </div>

        {/* ── Prompt Box ── */}
        <div className="border border-black/10 bg-white p-6 mb-8">
          <label className="block text-[10px] font-mono uppercase text-black/50 font-bold tracking-widest mb-3">
            BENCHMARK_PROMPT
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={2}
              className="flex-1 border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black transition-colors resize-none uppercase"
              placeholder="ENTER PROMPT FOR BENCHMARK..."
            />
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleStartArena}
                disabled={streaming || !modelA || !modelB || !modelC}
                className="btn-solid-black px-8 py-3.5 disabled:opacity-40"
              >
                {streaming ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                  className="btn-outline py-2 text-[10px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Quick-Select Strip ── */}
        <div className="border border-black/10 bg-black/[0.015] px-5 py-3 mb-8 flex items-center gap-3 overflow-x-auto scrollbar-none">
          <span className="font-mono text-[9px] font-bold text-black/50 uppercase tracking-widest whitespace-nowrap">QUICK SELECT:</span>
          {DOMAINS.slice(1).map(domain => {
            const domainModels = models.filter(m =>
              (m.domain || "").replace("_", " ").toUpperCase() === domain
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
                className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white border border-black/10 text-black/60 hover:text-black hover:border-black transition-all whitespace-nowrap disabled:opacity-30"
              >
                {domain} ({domainModels.length})
              </button>
            );
          })}
        </div>

        {/* ── 3-Way Split Arena Columns ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ArenaColumn
            slot="MODEL_A" modelId={modelA} modelObj={modelAObj}
            stream={streamA} ttft={ttftA} tokens={tokensA} accentColor="#000000"
          />
          <ArenaColumn
            slot="MODEL_B" modelId={modelB} modelObj={modelBObj}
            stream={streamB} ttft={ttftB} tokens={tokensB} accentColor="#FF4500"
          />
          <ArenaColumn
            slot="MODEL_C" modelId={modelC} modelObj={modelCObj}
            stream={streamC} ttft={ttftC} tokens={tokensC} accentColor="#64748B"
          />
        </div>

        {/* ── Token Velocity Comparison Bar ── */}
        {!streaming && (streamA || streamB || streamC) && (
          <div className="mt-8 border border-black/10 bg-white p-6">
            <div className="text-[10px] font-mono font-bold text-black uppercase tracking-widest mb-4">
              // TOKEN_VELOCITY_BENCHMARK
            </div>
            <div className="space-y-4">
              {[
                { label: modelAObj?.name || modelA, tokens: tokensA, color: "#000000" },
                { label: modelBObj?.name || modelB, tokens: tokensB, color: "#FF4500" },
                { label: modelCObj?.name || modelC, tokens: tokensC, color: "#64748B" },
              ].map(({ label, tokens, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-black/70 font-semibold truncate max-w-[240px]">{label}</span>
                    <span className="font-bold" style={{ color }}>{tokens} tokens</span>
                  </div>
                  <div className="h-1.5 bg-black/5 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
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
              <div className="mt-5 pt-4 border-t border-black/10 text-xs font-mono flex items-center gap-1.5">
                <span className="text-black/50">Voted Winner: </span>
                <strong className="text-[#FF4500] flex items-center gap-1">
                  <span>{models.find(m => m.id === votedWinner)?.name || votedWinner}</span>
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                </strong>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}