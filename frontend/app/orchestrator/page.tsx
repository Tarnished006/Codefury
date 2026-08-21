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
  Play
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { orchestrateDAG } from "@/lib/api";

const PRESET_GOALS = [
  {
    tag: "FINANCIAL AUDIT",
    prompt: "Audit balance sheet variances and compile python compliance logic"
  },
  {
    tag: "CLINICAL PHARMACOLOGY",
    prompt: "Analyze medical drug interactions and output FHIR code"
  },
  {
    tag: "BACKEND API DEPLOY",
    prompt: "Synthesize high-throughput FastAPI streaming endpoint with Pydantic v2 validation"
  }
];

export default function OrchestratorPage() {
  const [goal, setGoal] = useState(PRESET_GOALS[0].prompt);
  const [budgetMode, setBudgetMode] = useState<"high" | "low">("high");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const handleRun = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    try {
      const maxBudget = budgetMode === "low" ? 0.5 : 100.0;
      const res = await orchestrateDAG(goal, "usr_guest_demo", maxBudget);
      setResult(res);
      setSelectedStep(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
              <span className="badge-mono bg-black text-white">AUTONOMOUS_DAG_v2</span>
              <span className="font-mono text-xs text-[#64748B]">// Intent-Based Task Broker</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              Meta-Agent Orchestrator
            </h1>
          </div>

          {/* Budget Selector Mode */}
          <div className="flex items-center gap-2 border border-[#E2E8F0] bg-[#F8FAFC] p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setBudgetMode("high")}
              className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                budgetMode === "high"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#64748B] hover:text-black"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>High-Performance (50+ CR)</span>
            </button>
            <button
              onClick={() => setBudgetMode("low")}
              className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                budgetMode === "low"
                  ? "bg-black text-white shadow-xs"
                  : "text-[#64748B] hover:text-black"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Cost-Optimized (Economy)</span>
            </button>
          </div>
        </div>

        {/* ── Input Box & Preset Chips ── */}
        <div className="border border-[#E2E8F0] bg-white rounded-lg p-5 mb-8 shadow-xs">
          <label className="block text-xs font-mono uppercase text-[#64748B] font-semibold mb-2">
            NATURAL_LANGUAGE_INTENT_PROMPT
          </label>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="Type any complex goal (e.g. Audit balance sheet variances and compile python compliance logic)..."
              className="flex-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-3 text-sm font-sans text-black outline-none focus:border-black transition-colors resize-none"
            />
            <button
              onClick={handleRun}
              disabled={loading}
              className="btn-solid-black px-6 gap-2 self-stretch sm:self-auto shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
            <span className="text-[0.68rem] font-mono text-[#94A3B8] uppercase whitespace-nowrap">Presets:</span>
            {PRESET_GOALS.map((p) => (
              <button
                key={p.tag}
                onClick={() => setGoal(p.prompt)}
                className="px-2.5 py-1 text-[0.68rem] font-mono rounded bg-[#F1F5F9] text-[#64748B] hover:text-black hover:bg-[#E2E8F0] transition-colors whitespace-nowrap"
              >
                {p.tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── Execution Results & Interactive DAG Pipeline ── */}
        {result && (
          <div className="space-y-6">
            {/* Meta-Agent Execution Telemetry Banner */}
            <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-lg flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-black font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  STRATEGY: <span className="text-[#0284C7]">{result.budget_strategy}</span>
                </span>
                <span className="text-[#CBD5E1]">|</span>
                <span>EXECUTION_TIME: <strong className="text-black">{result.execution_time_ms}ms</strong></span>
                <span className="text-[#CBD5E1]">|</span>
                <span>ESTIMATED_COST: <strong className="text-black">{result.estimated_cost_credits} CR</strong></span>
              </div>
              <span className="badge-mono bg-white text-black font-bold">
                TOTAL_TOKENS: {result.total_tokens}
              </span>
            </div>

            {/* DAG Graph Pipeline Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
              {result.dag_plan.map((step: any, idx: number) => {
                const isSelected = selectedStep === idx;
                return (
                  <div
                    key={step.step_index}
                    onClick={() => setSelectedStep(idx)}
                    className={`cursor-pointer border rounded-lg p-5 transition-all relative ${
                      isSelected
                        ? "border-black bg-white shadow-md ring-1 ring-black"
                        : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                    }`}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[0.68rem] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-black">
                        STEP_0{step.step_index}
                      </span>
                      <span className="font-mono text-[0.68rem] text-[#10B981] font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#0284C7]" />
                        {step.latency_ms}ms
                      </span>
                    </div>

                    <h3 className="font-sans font-bold text-sm text-black mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-[#64748B] text-xs font-sans leading-relaxed mb-4">
                      {step.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] text-xs font-mono">
                      <span className="text-[#0284C7] font-semibold truncate max-w-[160px]">
                        {step.assigned_model_name}
                      </span>
                      <span className="text-[#64748B]">{step.cost_credits} CR</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trace Output Drawer for Selected Step */}
            {result.dag_plan[selectedStep] && (
              <div className="border border-[#E2E8F0] bg-white rounded-lg p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-black" />
                    <span className="font-mono text-xs font-bold text-black">
                      STEP_OUTPUT // {result.dag_plan[selectedStep].assigned_model_name}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#10B981]">
                    STATUS: {result.dag_plan[selectedStep].status}
                  </span>
                </div>

                <pre className="bg-[#09090B] text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
                  {result.dag_plan[selectedStep].output || "No output telemetry generated."}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}