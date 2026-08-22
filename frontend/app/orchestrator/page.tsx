"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  DollarSign,
  Shield,
  Layers,
  ChevronRight,
  Terminal,
  Play,
  FileCheck2,
  Check
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { orchestrateDAG } from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";

const PRESET_GOALS = [
  {
    tag: "FINANCIAL AUDIT",
    prompt: "Audit balance sheet variances and compile python compliance logic"
  },
  {
    tag: "CLINICAL PHARMACOLOGY",
    prompt: "Analyze medical drug interactions between Warfarin and NSAIDs with dosage contraindications"
  },
  {
    tag: "CRYPTO TRADING API",
    prompt: "Build high-throughput REST API for crypto trading with real-time WebSocket order book and risk telemetry"
  }
];

export default function OrchestratorPage() {
  const { user } = useAuthContext();
  const [goal, setGoal] = useState(PRESET_GOALS[0].prompt);
  const [budgetMode, setBudgetMode] = useState<"high" | "low">("high");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedStep, setSelectedStep] = useState<number>(0);

  // Dynamic Live Reasoning Telemetry State during Loading
  const [loadingStage, setLoadingStage] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const handleRun = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setLoadingStage(0);
    setLoadingLogs([
      "▶ [INIT_STAGE_01] Receiving natural language intent prompt...",
      "▶ [INTENT_PARSER] Invoking Groq openai/gpt-oss-120b Meta-Agent supervisor...",
    ]);
    setLoadingProgress(15);

    // Live AI thought generator interval
    const logsSequence = [
      "▶ [METRIC_RESOLVER] Parsing multi-domain constraints & security safety threshold...",
      "▶ [CATALOG_DISCOVERY] Scanning 51 Hugging Face verified repository models...",
      "▶ [DAG_TOPOLOGY] Decomposing complex intent into multi-stage dependency subtasks...",
      "▶ [BUDGET_ROUTER] Evaluating Pareto-optimal speed/cost trade-off matrix...",
      "▶ [NODE_EXEC_01] Dispatching primary subtask to specialist domain model...",
      "▶ [NODE_EXEC_02] Streaming cross-model contextual embeddings to verification agent...",
      "▶ [DELIVERABLE_COMPILER] Aggregating multi-agent outputs into unified deliverable...",
    ];

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < logsSequence.length) {
        const nextLog = logsSequence[currentLogIdx];
        setLoadingLogs((prev) => [...prev, nextLog]);
        setLoadingStage((prev) => Math.min(prev + 1, 4));
        setLoadingProgress((prev) => Math.min(prev + 12, 92));
        currentLogIdx++;
      }
    }, 450);

    try {
      const maxBudget = budgetMode === "low" ? 0.5 : 100.0;
      const res = await orchestrateDAG(goal, user?.id, maxBudget);
      clearInterval(interval);
      setLoadingProgress(100);
      setResult(res);
      setSelectedStep(0);
    } catch (e) {
      console.error(e);
      clearInterval(interval);
    } finally {
      clearInterval(interval);
      setLoading(false);
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
              <span className="badge-mono bg-black text-white font-bold">AUTONOMOUS_DAG_v2</span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">// Supervisor Intent Broker</span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              meta-agent orchestrator.
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-xl">
              Natural language intent decomposition into specialist DAG sub-tasks via Groq openai/gpt-oss-120b.
            </p>
          </div>

          {/* Budget Selector Mode */}
          <div className="flex items-center gap-2 border border-black/10 bg-black/[0.02] p-1 self-start sm:self-auto">
            <button
              onClick={() => setBudgetMode("high")}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                budgetMode === "high"
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>High-Performance (50+ CR)</span>
            </button>
            <button
              onClick={() => setBudgetMode("low")}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                budgetMode === "low"
                  ? "bg-black text-white"
                  : "text-black/50 hover:text-black"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Cost-Optimized (Economy)</span>
            </button>
          </div>
        </div>

        {/* ── Input Box & Preset Chips ── */}
        <div className="border border-black/10 bg-white p-6 mb-8">
          <label className="block text-[10px] font-mono uppercase text-black/50 font-bold tracking-widest mb-3">
            NATURAL_LANGUAGE_INTENT_PROMPT
          </label>

          <div className="flex flex-col sm:flex-row gap-4">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="ENTER YOUR COMPLEX GOAL (e.g. Audit balance sheet variances and compile python compliance logic)..."
              className="flex-1 border border-black/15 bg-black/[0.015] p-3.5 text-xs font-mono text-black uppercase tracking-wider outline-none focus:border-black transition-colors resize-none"
            />
            <button
              onClick={handleRun}
              disabled={loading}
              className="btn-solid-black px-8 py-3.5 self-stretch sm:self-auto shrink-0 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing DAG...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Execute Orchestration</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest whitespace-nowrap">PRESETS:</span>
            {PRESET_GOALS.map((p) => (
              <button
                key={p.tag}
                onClick={() => setGoal(p.prompt)}
                className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-black/[0.02] text-black/60 hover:text-black hover:bg-black/5 border border-black/10 transition-colors whitespace-nowrap"
              >
                {p.tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── Dynamic AI Synthesis & Real-Time Reasoning Stream (Loading State) ── */}
        {loading && (
          <div className="space-y-6 mb-8 animate-in fade-in duration-300">
            {/* Live Progress Bar & Stage Telemetry */}
            <div className="border border-black bg-black text-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF4500] animate-ping" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#FF4500]">
                    AUTONOMOUS_META_AGENT // LIVE_DECOMPOSITION_IN_PROGRESS
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-white/70">
                  {loadingProgress}% SYNTHESIS COMPLETE
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-zinc-800 overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4500] to-[#10B981] transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              {/* Multi-Stage Step Pipeline Indicator */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono uppercase">
                {[
                  { step: "01", name: "Semantic Parse", stage: 0 },
                  { step: "02", name: "Catalog Match", stage: 1 },
                  { step: "03", name: "DAG Routing", stage: 2 },
                  { step: "04", name: "Compiling Artifact", stage: 3 },
                ].map((s) => {
                  const isDone = loadingStage > s.stage;
                  const isActive = loadingStage === s.stage;
                  return (
                    <div
                      key={s.step}
                      className={`p-2 border transition-colors ${
                        isDone
                          ? "border-[#10B981] bg-[#10B981]/10 text-[#10B981]"
                          : isActive
                          ? "border-[#FF4500] bg-[#FF4500]/10 text-white font-bold"
                          : "border-zinc-800 text-zinc-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>STAGE_{s.step}</span>
                        {isDone ? <span>✓</span> : isActive ? <span className="animate-spin">●</span> : <span>—</span>}
                      </div>
                      <div className="truncate text-[9px] mt-0.5">{s.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic AI Reasoning Logs Terminal */}
            <div className="border border-black/15 bg-[#09090B] text-zinc-300 p-6 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#FF4500]" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                    LIVE_REASONING_STREAM // SUPERVISOR_EVENT_LOGS
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>GROQ_LPU_ONLINE</span>
                </div>
              </div>

              <div className="font-mono text-xs space-y-2 leading-relaxed max-h-[220px] overflow-y-auto">
                {loadingLogs.map((log, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                  >
                    <span className="text-[#FF4500] shrink-0 font-bold">›</span>
                    <span className={index === loadingLogs.length - 1 ? "text-white font-semibold" : "text-zinc-400"}>
                      {log}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1 text-[#FF4500] animate-pulse">
                  <span>_</span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Generating specialist model payloads...</span>
                </div>
              </div>
            </div>

            {/* Skeleton Node Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((node) => (
                <div
                  key={node}
                  className="border border-black/10 bg-black/[0.015] p-5 animate-pulse space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-16 bg-black/10 rounded-none" />
                    <div className="h-4 w-12 bg-black/10 rounded-none" />
                  </div>
                  <div className="h-5 w-3/4 bg-black/10 rounded-none" />
                  <div className="h-10 w-full bg-black/5 rounded-none" />
                  <div className="h-4 w-1/2 bg-[#FF4500]/20 rounded-none pt-2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Execution Results & Interactive DAG Pipeline ── */}
        {result && (
          <div className="space-y-8">
            {/* Meta-Agent Execution Telemetry Banner */}
            <div className="border border-black/10 bg-black/[0.02] p-5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-black font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  STRATEGY: <span className="text-[#FF4500]">{result.budget_strategy}</span>
                </span>
                <span className="text-black/20">|</span>
                <span>EXECUTION_TIME: <strong className="text-black">{result.execution_time_ms}ms</strong></span>
                <span className="text-black/20">|</span>
                <span>ESTIMATED_COST: <strong className="text-black">{result.estimated_cost_credits} CR</strong></span>
              </div>
              <span className="badge-mono bg-black text-white font-bold">
                TOTAL_TOKENS: {result.total_tokens}
              </span>
            </div>

            {/* DAG Graph Pipeline Nodes */}
            <div>
              <div className="text-[10px] font-mono font-bold text-black uppercase tracking-widest mb-3">
                // SEQUENTIAL_DAG_SUBTASKS ({result.dag_plan.length} NODES)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.dag_plan.map((step: any, idx: number) => {
                  const isSelected = selectedStep === idx;
                  return (
                    <div
                      key={step.step_index}
                      onClick={() => setSelectedStep(idx)}
                      className={`cursor-pointer border p-6 transition-all relative ${
                        isSelected
                          ? "border-[#FF4500] bg-white ring-1 ring-[#FF4500]"
                          : "border-black/10 bg-white hover:border-black/30"
                      }`}
                    >
                      {/* Node Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-black text-white uppercase">
                          STEP_0{step.step_index}
                        </span>
                        <span className="font-mono text-[10px] text-[#10B981] font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#FF4500]" />
                          {step.latency_ms}ms
                        </span>
                      </div>

                      <h3 className="font-sans font-bold text-base text-black mb-2">
                        {step.title}
                      </h3>
                      <p className="text-black/60 text-xs font-sans leading-relaxed mb-4">
                        {step.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-black/10 text-xs font-mono">
                        <span className="text-[#FF4500] font-bold truncate max-w-[180px]">
                          {step.assigned_model_name}
                        </span>
                        <span className="text-black/50">{step.cost_credits} CR</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trace Output Drawer for Selected Step */}
            {result.dag_plan[selectedStep] && (
              <div className="border border-black/10 bg-white p-6">
                <div className="flex items-center justify-between mb-4 border-b border-black/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#FF4500]" />
                    <span className="font-mono text-xs font-bold text-black uppercase tracking-wider">
                      STEP_OUTPUT // {result.dag_plan[selectedStep].assigned_model_name} ({result.dag_plan[selectedStep].title})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#10B981] font-bold uppercase">
                    STATUS: {result.dag_plan[selectedStep].status}
                  </span>
                </div>

                <pre className="bg-black text-white p-5 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {result.dag_plan[selectedStep].output || "No output telemetry generated."}
                </pre>
              </div>
            )}

            {/* Master Synthesis Deliverable */}
            {result.final_output && (
              <div className="border border-black/10 bg-white p-8">
                <div className="flex items-center gap-2 mb-4 border-b border-black/10 pb-3">
                  <FileCheck2 className="w-4 h-4 text-[#10B981]" />
                  <span className="font-mono text-xs font-bold text-black uppercase tracking-widest">
                    MASTER_SYNTHESIZED_DELIVERABLE // GROQ SUPERVISOR
                  </span>
                </div>
                <div className="text-xs font-mono leading-relaxed text-black/80 whitespace-pre-wrap bg-black/[0.015] p-5 border border-black/5">
                  {result.final_output}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}