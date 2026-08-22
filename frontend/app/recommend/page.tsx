"use client";

import { useState } from "react";
import Link from "next/link";
import NeuralNavbar from "@/components/NeuralNavbar";
import {
  Sparkles,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Sliders,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  Activity,
  Code2,
  FileCode,
  Search
} from "lucide-react";

interface RecommendedModel {
  model_id: string;
  name: string;
  repo_id: string;
  domain: string;
  task_tag?: string;
  match_score: number;
  price_per_1k: number;
  p50_latency_ms: number;
  context_length: number;
  fit_rationale: string;
  pros: string[];
  cons: string[];
  recommended_params: {
    temperature: number;
    max_tokens: number;
    system_prompt_hint?: string;
  };
}

interface RecommendationData {
  use_case: string;
  domain_selected: string;
  budget_strategy: string;
  total_models_evaluated: number;
  recommended_models: RecommendedModel[];
  architect_summary: string;
}

const PRESETS = [
  {
    label: "Edge Code Completion",
    domain: "CODE GEN",
    text: "Sub-50ms latency Python and TypeScript code generation for VS Code IDE extension.",
    budget: "BALANCED",
  },
  {
    label: "Clinical Health Diagnostic",
    domain: "HEALTHCARE",
    text: "HIPAA-compliant clinical record summarization and pharmacology drug-interaction checking.",
    budget: "PERFORMANCE",
  },
  {
    label: "Algorithmic Market Sentiment",
    domain: "FINANCE",
    text: "High-frequency news sentiment analysis on 10-K regulatory filings and earnings transcripts.",
    budget: "BALANCED",
  },
  {
    label: "Cost-Optimized Support Bot",
    domain: "LLM CHAT",
    text: "High-throughput customer support agent with sub-0.05 credits per 1k token cost.",
    budget: "ECONOMY",
  },
  {
    label: "Multimodal Vision OCR",
    domain: "VISION AI",
    text: "Extracting structured bounding boxes and table data from scanned financial PDFs.",
    budget: "PERFORMANCE",
  },
];

export default function RecommenderPage() {
  const [useCase, setUseCase] = useState(
    "Low-latency Python API backend generator with strict typing and SQL schema optimization."
  );
  const [domain, setDomain] = useState("ALL");
  const [budgetTier, setBudgetTier] = useState("BALANCED");
  const [minContext, setMinContext] = useState(8192);
  const [maxLatency, setMaxLatency] = useState(60);
  const [priority, setPriority] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecommend = async () => {
    if (!useCase.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/models/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_case: useCase,
          domain: domain === "ALL" ? null : domain,
          budget_tier: budgetTier,
          min_context_length: minContext,
          max_latency_ms: maxLatency,
          priority: priority,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate recommendations from gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF4500] selection:text-white">
      <NeuralNavbar />

      <main className="pt-28 pb-20 px-6 max-w-[1400px] mx-auto">
        {/* ── Page Header ── */}
        <div className="border-b border-black pb-8 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/[0.03] border border-black/15 font-mono text-[10px] font-bold uppercase tracking-widest text-black mb-3">
                <Sparkles className="w-3 h-3 text-[#FF4500]" />
                <span>Intelligent Model Recommendation Engine</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-black">
                Model Matchmaker & Workload Recommender
              </h1>
              <p className="text-black/60 text-sm md:text-base mt-2 max-w-2xl">
                Specify your technical requirements, latency thresholds, and budget constraints.
                Our LLM architect evaluates 51+ foundation models to prescribe the optimal fit.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/arena"
                className="px-4 py-2 border border-black/20 hover:border-black font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors"
              >
                Arena Benchmark
              </Link>
              <Link
                href="/orchestrator"
                className="px-4 py-2 bg-black text-white hover:bg-[#FF4500] font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Meta-Agent DAG
              </Link>
            </div>
          </div>
        </div>

        {/* ── Quick Presets ── */}
        <div className="mb-8">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-black/50 mb-2.5">
            Quick Requirement Presets:
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setUseCase(p.text);
                  setDomain(p.domain);
                  setBudgetTier(p.budget);
                }}
                className="px-3 py-1.5 bg-black/[0.02] border border-black/15 hover:border-black font-mono text-[11px] font-bold text-black/80 hover:text-black transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-[#FF4500]" />
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Configuration Form & Control Matrix ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left: Use Case Input (7 Cols) */}
          <div className="lg:col-span-7 border border-black p-6 bg-white space-y-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#FF4500]" />
                <span>1. Technical Task Specification</span>
              </div>
              <span className="font-mono text-[10px] text-black/40 uppercase">Natural Language</span>
            </div>

            <div>
              <label className="block font-mono text-[11px] text-black/70 uppercase tracking-wider mb-2 font-bold">
                Workload Description & Constraints:
              </label>
              <textarea
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                rows={5}
                placeholder="Describe your workload, throughput requirements, language/domain, and specific accuracy criteria..."
                className="w-full p-3.5 bg-black/[0.02] border border-black/20 focus:border-black focus:outline-none text-xs font-sans leading-relaxed text-black"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] text-black/60 uppercase tracking-wider mb-1.5 font-bold">
                  Domain Filter:
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                >
                  <option value="ALL">ALL DOMAINS (Mesh Catalog)</option>
                  <option value="CODE GEN">CODE GEN (Software & Algorithmic)</option>
                  <option value="LLM CHAT">LLM CHAT (Reasoning & General)</option>
                  <option value="HEALTHCARE">HEALTHCARE (Clinical & Biomedical)</option>
                  <option value="FINANCE">FINANCE (Quantitative & Economic)</option>
                  <option value="VISION AI">VISION AI (Multimodal Perception)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-black/60 uppercase tracking-wider mb-1.5 font-bold">
                  Optimization Priority:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-black/[0.02] border border-black/20 focus:border-black font-mono text-xs font-bold text-black"
                >
                  <option value="balanced">Balanced (Cost vs. Speed vs. Accuracy)</option>
                  <option value="speed">Ultra-Low Latency (Sub-35ms SLA)</option>
                  <option value="quality">Frontier Reasoning (Deep Chain-of-Thought)</option>
                  <option value="cost">Minimum Cost (Budget-Optimized)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right: Technical Sliders & Execution Trigger (5 Cols) */}
          <div className="lg:col-span-5 border border-black p-6 bg-black/[0.02] flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-5">
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FF4500]" />
                  <span>2. Hard Hardware Constraints</span>
                </div>
                <span className="font-mono text-[10px] text-black/40 uppercase">SLAs</span>
              </div>

              <div className="space-y-4">
                {/* Budget Tier */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5 font-bold">
                    <span className="text-black/60 uppercase">Budget Tier:</span>
                    <span className="text-[#FF4500]">{budgetTier}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["ECONOMY", "BALANCED", "PERFORMANCE"].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBudgetTier(b)}
                        className={`py-1.5 font-mono text-[10px] font-bold uppercase border transition-all ${
                          budgetTier === b
                            ? "bg-black text-white border-black"
                            : "bg-white text-black/60 border-black/20 hover:border-black"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Context Window */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5 font-bold">
                    <span className="text-black/60 uppercase">Min Context Window:</span>
                    <span className="text-black">{minContext.toLocaleString()} tokens</span>
                  </div>
                  <input
                    type="range"
                    min={4096}
                    max={65536}
                    step={4096}
                    value={minContext}
                    onChange={(e) => setMinContext(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-black/40 mt-1">
                    <span>4k</span>
                    <span>16k</span>
                    <span>32k</span>
                    <span>64k+</span>
                  </div>
                </div>

                {/* Max Latency Threshold */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5 font-bold">
                    <span className="text-black/60 uppercase">Max P50 Latency:</span>
                    <span className="text-black">{maxLatency} ms</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={120}
                    step={5}
                    value={maxLatency}
                    onChange={(e) => setMaxLatency(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-black/40 mt-1">
                    <span>20ms</span>
                    <span>50ms</span>
                    <span>80ms</span>
                    <span>120ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRecommend}
              disabled={loading || !useCase.trim()}
              className="w-full py-4 bg-black hover:bg-[#FF4500] text-white font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md rounded-sm active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>Evaluating 51+ Catalog Models...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#FF4500] group-hover:text-white" />
                  <span>Prescribe Optimal Foundation Models</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-4 mb-8 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Recommendation Results Display ── */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Architect Summary Box */}
            <div className="p-5 bg-black text-white border border-black">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#FF4500] font-bold mb-1 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" />
                <span>AgentHub Chief Model Architect Assessment:</span>
              </div>
              <p className="text-sm font-sans text-white/90 leading-relaxed">
                {result.architect_summary}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-4 font-mono text-[10px] text-white/60">
                <span>Evaluated: {result.total_models_evaluated} models</span>
                <span>Domain: {result.domain_selected}</span>
                <span>Strategy: {result.budget_strategy}</span>
              </div>
            </div>

            {/* Model Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.recommended_models.map((rec, rIdx) => (
                <div
                  key={rec.model_id}
                  className="border border-black p-5 bg-white flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 relative group"
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4">
                    <span className="px-2 py-1 bg-black text-white font-mono text-[10px] font-bold tracking-widest uppercase">
                      Rank #{rIdx + 1}
                    </span>
                    <div className="flex items-center gap-1 text-[#FF4500] font-mono text-xs font-extrabold">
                      <span>{rec.match_score}%</span>
                      <span className="text-[10px] text-black/50">MATCH</span>
                    </div>
                  </div>

                  {/* Model Name & Domain */}
                  <div>
                    <h3 className="text-base font-extrabold text-black group-hover:text-[#FF4500] transition-colors">
                      {rec.name}
                    </h3>
                    <div className="font-mono text-[10px] text-black/50 mt-0.5 truncate">
                      `{rec.model_id}`
                    </div>

                    {/* Telemetry Strip */}
                    <div className="grid grid-cols-3 gap-1.5 my-3 p-2 bg-black/[0.02] border border-black/10 text-center font-mono text-[10px]">
                      <div>
                        <div className="text-black/40 uppercase">Latency</div>
                        <div className="font-bold text-black">{rec.p50_latency_ms}ms</div>
                      </div>
                      <div>
                        <div className="text-black/40 uppercase">Context</div>
                        <div className="font-bold text-black">{rec.context_length.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-black/40 uppercase">Price/1k</div>
                        <div className="font-bold text-black">${rec.price_per_1k}</div>
                      </div>
                    </div>

                    {/* Fit Rationale */}
                    <div className="text-xs text-black/80 font-sans leading-relaxed my-3">
                      {rec.fit_rationale}
                    </div>

                    {/* Pros and Cons */}
                    <div className="space-y-2 my-3 text-[11px]">
                      {rec.pros.map((pro, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-1.5 text-black/80">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </div>
                      ))}
                      {rec.cons.map((con, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-1.5 text-black/60">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recommended Parameters Hint */}
                    {rec.recommended_params && (
                      <div className="mt-3 p-2.5 bg-black/[0.03] border border-black/10 font-mono text-[10px] text-black/70 space-y-1">
                        <div className="font-bold text-black uppercase">Recommended Config:</div>
                        <div>Temp: {rec.recommended_params.temperature} · Max Tokens: {rec.recommended_params.max_tokens}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-black/10 flex items-center gap-2">
                    <Link
                      href={`/arena?model=${rec.model_id}`}
                      className="flex-1 py-2 text-center bg-black text-white hover:bg-[#FF4500] font-mono text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Arena Test</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/deployments`}
                      className="px-3 py-2 border border-black/20 hover:border-black font-mono text-[10px] font-bold uppercase tracking-wider text-black transition-colors"
                      title="Deploy Gateway Proxy"
                    >
                      Deploy
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
