"use client";

import { useState, useEffect, useRef } from "react";
import {
  GitCompare,
  Play,
  Zap,
  Clock,
  Award,
  Sparkles,
  Layers,
  CheckCircle2,
  RefreshCw,
  Cpu
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";

const DEFAULT_MODELS = [
  { id: "llama3", name: "Llama 3 8B Instruct", provider: "Meta AI", color: "border-blue-500" },
  { id: "deepseek", name: "DeepSeek Coder 6.7B", provider: "DeepSeek AI", color: "border-emerald-500" },
  { id: "mistral", name: "Mistral 7B Instruct", provider: "Mistral AI", color: "border-amber-500" },
];

const ALL_MODELS = [
  { id: "llama3", name: "Llama 3 8B Instruct" },
  { id: "deepseek", name: "DeepSeek Coder 6.7B" },
  { id: "biomedlm", name: "BioMistral 7B Medical" },
  { id: "llava", name: "LLaVA 1.5 7B Vision" },
  { id: "fingpt", name: "FinGPT Forecaster" },
  { id: "mistral", name: "Mistral 7B Instruct v0.3" },
];

export default function ArenaPage() {
  const [prompt, setPrompt] = useState("Explain the architecture of a high-throughput API gateway with asynchronous rate limiting.");
  const [modelA, setModelA] = useState("llama3");
  const [modelB, setModelB] = useState("deepseek");
  const [modelC, setModelC] = useState("mistral");

  const [streamA, setStreamA] = useState("");
  const [streamB, setStreamB] = useState("");
  const [streamC, setStreamC] = useState("");

  const [ttftA, setTtftA] = useState<number | null>(null);
  const [ttftB, setTtftB] = useState<number | null>(null);
  const [ttftC, setTtftC] = useState<number | null>(null);

  const [tokensA, setTokensA] = useState(0);
  const [tokensB, setTokensB] = useState(0);
  const [tokensC, setTokensC] = useState(0);

  const [streaming, setStreaming] = useState(false);
  const [votedWinner, setVotedWinner] = useState<string | null>(null);

  const handleStartArena = async () => {
    if (!prompt.trim() || streaming) return;
    setStreaming(true);
    setStreamA("");
    setStreamB("");
    setStreamC("");
    setTtftA(null);
    setTtftB(null);
    setTtftC(null);
    setTokensA(0);
    setTokensB(0);
    setTokensC(0);
    setVotedWinner(null);

    const startTime = Date.now();

    try {
      const res = await fetch("http://localhost:8000/api/arena/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model_ids: [modelA, modelB, modelC],
        }),
      });

      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const now = Date.now();
              const elapsed = now - startTime;

              if (data.model_id === modelA) {
                setStreamA((prev) => prev + data.token);
                setTokensA((prev) => prev + 1);
                if (ttftA === null) setTtftA(elapsed);
              } else if (data.model_id === modelB) {
                setStreamB((prev) => prev + data.token);
                setTokensB((prev) => prev + 1);
                if (ttftB === null) setTtftB(elapsed);
              } else if (data.model_id === modelC) {
                setStreamC((prev) => prev + data.token);
                setTokensC((prev) => prev + 1);
                if (ttftC === null) setTtftC(elapsed);
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (e) {
      console.error("Arena stream error", e);
    } finally {
      setStreaming(false);
    }
  };

  const handleVote = (modelId: string) => {
    setVotedWinner(modelId);
    fetch("http://localhost:8000/api/arena/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: "arena_demo", winner_model_id: modelId }),
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-mono bg-black text-white">ARENA_3_WAY_STREAM</span>
              <span className="font-mono text-xs text-[#64748B]">// Concurrent Model Benchmark</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              Model Matchmaker Arena
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#64748B]">
              CONCURRENT_SSE: <strong className="text-black">ACTIVE</strong>
            </span>
          </div>
        </div>

        {/* ── Prompt Box & Execution Trigger ── */}
        <div className="border border-[#E2E8F0] bg-white rounded-lg p-5 mb-8 shadow-xs">
          <label className="block text-xs font-mono uppercase text-[#64748B] font-semibold mb-2">
            BENCHMARK_PROMPT_INPUT
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              className="flex-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-3 text-sm font-sans text-black outline-none focus:border-black transition-colors resize-none"
              placeholder="Enter benchmark prompt..."
            />
            <button
              onClick={handleStartArena}
              disabled={streaming}
              className="btn-solid-black px-6 gap-2 shrink-0 self-stretch sm:self-auto"
            >
              {streaming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Streaming 3-Way...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Stream Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── 3-Way Split Screen Arena ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Column A ── */}
          <div className="border border-[#E2E8F0] bg-white rounded-lg flex flex-col justify-between overflow-hidden shadow-xs">
            <div>
              {/* Card Header & Model Selector */}
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-black">MODEL_A</span>
                  <span className="text-[0.68rem] font-mono text-[#0284C7] font-semibold">
                    TTFT: {ttftA !== null ? `${ttftA}ms` : "—"}
                  </span>
                </div>
                <select
                  value={modelA}
                  onChange={(e) => setModelA(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded p-2 text-xs font-sans font-semibold text-black outline-none"
                >
                  {ALL_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Streaming Content Body */}
              <div className="p-5 min-h-[260px] text-xs font-mono leading-relaxed text-[#09090B] whitespace-pre-wrap">
                {streamA || (streaming ? "Waiting for first token..." : "Click 'Stream Benchmark' to start.")}
              </div>
            </div>

            {/* Telemetry & Winner Vote Button */}
            <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-xs font-mono text-[#64748B]">
                TOKENS: <strong className="text-black">{tokensA}</strong>
              </span>
              <button
                onClick={() => handleVote(modelA)}
                className={`px-3 py-1.5 rounded text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                  votedWinner === modelA
                    ? "bg-[#10B981] text-white"
                    : "bg-white border border-[#E2E8F0] text-black hover:border-black"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{votedWinner === modelA ? "Winner Selected" : "Vote Winner"}</span>
              </button>
            </div>
          </div>

          {/* ── Column B ── */}
          <div className="border border-[#E2E8F0] bg-white rounded-lg flex flex-col justify-between overflow-hidden shadow-xs">
            <div>
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-black">MODEL_B</span>
                  <span className="text-[0.68rem] font-mono text-[#10B981] font-semibold">
                    TTFT: {ttftB !== null ? `${ttftB}ms` : "—"}
                  </span>
                </div>
                <select
                  value={modelB}
                  onChange={(e) => setModelB(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded p-2 text-xs font-sans font-semibold text-black outline-none"
                >
                  {ALL_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-5 min-h-[260px] text-xs font-mono leading-relaxed text-[#09090B] whitespace-pre-wrap">
                {streamB || (streaming ? "Waiting for first token..." : "Click 'Stream Benchmark' to start.")}
              </div>
            </div>

            <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-xs font-mono text-[#64748B]">
                TOKENS: <strong className="text-black">{tokensB}</strong>
              </span>
              <button
                onClick={() => handleVote(modelB)}
                className={`px-3 py-1.5 rounded text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                  votedWinner === modelB
                    ? "bg-[#10B981] text-white"
                    : "bg-white border border-[#E2E8F0] text-black hover:border-black"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{votedWinner === modelB ? "Winner Selected" : "Vote Winner"}</span>
              </button>
            </div>
          </div>

          {/* ── Column C ── */}
          <div className="border border-[#E2E8F0] bg-white rounded-lg flex flex-col justify-between overflow-hidden shadow-xs">
            <div>
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-black">MODEL_C</span>
                  <span className="text-[0.68rem] font-mono text-[#F59E0B] font-semibold">
                    TTFT: {ttftC !== null ? `${ttftC}ms` : "—"}
                  </span>
                </div>
                <select
                  value={modelC}
                  onChange={(e) => setModelC(e.target.value)}
                  className="w-full bg-white border border-[#E2E8F0] rounded p-2 text-xs font-sans font-semibold text-black outline-none"
                >
                  {ALL_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-5 min-h-[260px] text-xs font-mono leading-relaxed text-[#09090B] whitespace-pre-wrap">
                {streamC || (streaming ? "Waiting for first token..." : "Click 'Stream Benchmark' to start.")}
              </div>
            </div>

            <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-xs font-mono text-[#64748B]">
                TOKENS: <strong className="text-black">{tokensC}</strong>
              </span>
              <button
                onClick={() => handleVote(modelC)}
                className={`px-3 py-1.5 rounded text-xs font-sans font-semibold transition-all flex items-center gap-1.5 ${
                  votedWinner === modelC
                    ? "bg-[#10B981] text-white"
                    : "bg-white border border-[#E2E8F0] text-black hover:border-black"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{votedWinner === modelC ? "Winner Selected" : "Vote Winner"}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}