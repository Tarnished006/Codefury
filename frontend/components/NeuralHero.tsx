"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Cpu,
  Shield,
  GitCompare,
  Code2,
  Sparkles,
  Zap,
  CheckCircle2,
  Activity,
  Layers,
  Play,
  Copy,
  Check,
  Server,
  ArrowUpRight
} from "lucide-react";

// Load 3D Rotating Dotted Earth Globe (floating with no surrounding box)
const OrchestratorGlobe = dynamic(() => import("./OrchestratorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[540px] aspect-square flex items-center justify-center">
      <div className="w-64 h-64 rounded-full border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-[#64748B]">[ LOADING_EARTH_MESH... ]</span>
      </div>
    </div>
  ),
});

const DOMAINS = ["ALL_DOMAINS", "LLM_CHAT", "CODE_GEN", "VISION_AI", "HEALTHCARE", "FINANCE"];

const MODELS = [
  {
    id: "llama3",
    name: "Llama 3 8B Instruct",
    domain: "LLM_CHAT",
    tag: "Text Generation",
    p50: 38,
    hf: "meta-llama/Meta-Llama-3-8B-Instruct",
    security: 98,
    cost: "0.12",
    context: "8,192 tokens",
    status: "ONLINE",
  },
  {
    id: "deepseek",
    name: "DeepSeek Coder 6.7B",
    domain: "CODE_GEN",
    tag: "Code Synthesis",
    p50: 32,
    hf: "deepseek-ai/deepseek-coder-6.7b-instruct",
    security: 96,
    cost: "0.08",
    context: "16,384 tokens",
    status: "ONLINE",
  },
  {
    id: "biomedlm",
    name: "BioMistral 7B Medical",
    domain: "HEALTHCARE",
    tag: "Clinical Reasoning",
    p50: 48,
    hf: "BioMistral/BioMistral-7B",
    security: 99,
    cost: "0.18",
    context: "4,096 tokens",
    status: "ONLINE",
  },
  {
    id: "llava",
    name: "LLaVA 1.5 7B Vision",
    domain: "VISION_AI",
    tag: "Visual QA & Multimodal",
    p50: 56,
    hf: "llava-hf/llava-1.5-7b-hf",
    security: 94,
    cost: "0.22",
    context: "4,096 tokens",
    status: "ONLINE",
  },
  {
    id: "fingpt",
    name: "FinGPT Forecaster",
    domain: "FINANCE",
    tag: "Financial Sentiment",
    p50: 35,
    hf: "FinGPT/fingpt-forecaster",
    security: 97,
    cost: "0.10",
    context: "8,192 tokens",
    status: "ONLINE",
  },
  {
    id: "mistral",
    name: "Mistral 7B Instruct v0.3",
    domain: "LLM_CHAT",
    tag: "Function Calling",
    p50: 34,
    hf: "mistralai/Mistral-7B-Instruct-v0.3",
    security: 95,
    cost: "0.09",
    context: "32,768 tokens",
    status: "ONLINE",
  },
];

const FEATURES = [
  {
    icon: Cpu,
    tag: "PILLAR_01 // INTENT_ROUTER",
    title: "Meta-Agent Orchestrator",
    desc: "Autonomous task broker that decomposes complex natural language goals into multi-stage DAGs, querying and hiring specialized domain models automatically.",
    badge: "Autonomous DAG Routing",
  },
  {
    icon: GitCompare,
    tag: "PILLAR_02 // 3_WAY_STREAM",
    title: "Model Matchmaker Arena",
    desc: "Split-screen benchmarking sandbox. Stream inferences from 3 models concurrently to compare token velocity, cost, and qualitative output in real-time.",
    badge: "Real-time SSE Benchmark",
  },
  {
    icon: Shield,
    tag: "PILLAR_03 // RED_TEAM_SECURITY",
    title: "OWASP Red-Team Auditor",
    desc: "Automated vulnerability scanner generating a multi-axis Security Radar for Prompt Injection, Task Hijacking, and Context Leakage resistance.",
    badge: "Automated Audit Engine",
  },
  {
    icon: Code2,
    tag: "PILLAR_04 // INSTANT_EXECUTION",
    title: "Live Code-to-Deploy Canvas",
    desc: "In-browser interactive Monaco SDK playground. Test your provisioned API key with instant Python or TypeScript snippets running against live GPU clusters.",
    badge: "Interactive SDK Sandbox",
  },
];

export default function NeuralHero() {
  const [selectedDomain, setSelectedDomain] = useState("ALL_DOMAINS");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredModels =
    selectedDomain === "ALL_DOMAINS"
      ? MODELS
      : MODELS.filter((m) => m.domain === selectedDomain);

  const handleCopy = (hf: string) => {
    navigator.clipboard.writeText(hf);
    setCopiedId(hf);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen pt-16">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP TELEMETRY STATUS HUD
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-6 pb-2">
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-4 text-[0.72rem] font-mono text-[#64748B]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-black font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              GLOBAL GPU MESH: ACTIVE
            </span>
            <span className="text-[#CBD5E1]">|</span>
            <span>NODES: <strong className="text-black font-semibold">842 GPUs</strong></span>
            <span className="text-[#CBD5E1]">|</span>
            <span>THROUGHPUT: <strong className="text-black font-semibold">142.8M tok/day</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white border border-[#E2E8F0] px-2.5 py-0.5 rounded text-black font-medium">
              HF HUB: SYNCED
            </span>
            <span className="bg-black text-white px-2.5 py-0.5 rounded font-medium">
              DEMO MODE: ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Left Content & Free-Floating Rotating Earth
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center min-h-[540px]">

          {/* ── LEFT COLUMN: Typography & Attractive Buttons ── */}
          <div className="flex flex-col justify-center">

            {/* Architecture Version Badge */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-xs font-mono font-medium rounded-full shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                AgentHub v2.0
              </span>
              <span className="font-mono text-xs text-[#64748B]">
                // Autonomous Model Network
              </span>
            </div>

            {/* Main Headline: AgentHub */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-black text-[clamp(3.2rem,6.2vw,5.2rem)] text-black leading-[1.03] tracking-[-0.045em] mb-6"
            >
              agenthub
            </motion.h1>

            {/* Sub-headline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mb-4 font-sans"
            >
              The Global Standard for{" "}
              <span className="text-[#64748B] font-semibold">Autonomous Intelligence.</span>
            </motion.div>

            {/* Technical Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm text-[#475569] leading-relaxed max-w-xl mb-8 font-sans"
            >
              Deploy, benchmark, and scale open-weight Hugging Face models across high-throughput GPU clusters with autonomous Meta-Agent DAG task orchestration and automated OWASP red-team security audits.
            </motion.p>

            {/* Attractive Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="flex flex-wrap items-center gap-3.5 mb-10"
            >
              <a
                href="#model-catalog"
                className="btn-solid-black gap-2.5 group"
              >
                <span>Enter Marketplace</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </a>

              <Link
                href="/browse"
                className="btn-outline gap-2"
              >
                <GitCompare className="w-4 h-4 text-[#0284C7]" />
                <span>Launch 3-Way Arena</span>
              </Link>
            </motion.div>

            {/* Spec Matrix Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-3 gap-px border border-[#E2E8F0] bg-[#E2E8F0] rounded-lg overflow-hidden"
            >
              {[
                { label: "P50 Latency", val: "38ms avg" },
                { label: "Security Audit", val: "OWASP Top 10" },
                { label: "Provisioned Wallet", val: "500 Credits" },
              ].map((item) => (
                <div key={item.label} className="bg-white p-3.5">
                  <div className="text-[0.65rem] font-mono uppercase text-[#64748B] mb-0.5">{item.label}</div>
                  <div className="text-sm font-sans font-bold text-black">{item.val}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Free-Floating Rotating Dotted Earth (No Box) ── */}
          <div className="flex items-center justify-center relative w-full">
            <OrchestratorGlobe />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION DIVIDER
         ═══════════════════════════════════════════════════════════════════ */}
      <div id="model-catalog" className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 border-t border-[#E2E8F0] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7]" />
            MODEL MARKETPLACE // HUGGING FACE REPOSITORY
          </span>
          <div className="flex-1 border-t border-dashed border-[#E2E8F0]" />
          <span className="font-mono text-xs text-[#64748B]">
            6 ENDPOINTS READY
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE MODEL CATALOG (Domain Filter + Table)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">

        {/* Domain Filter Bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3.5 py-1.5 text-xs font-sans font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedDomain === domain
                  ? "bg-black text-white shadow-xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-black border border-[#E2E8F0]"
              }`}
            >
              {domain.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Model Data Table */}
        <div className="border border-[#E2E8F0] bg-white rounded-lg overflow-hidden divide-y divide-[#E2E8F0] shadow-xs">
          {/* Table Headers */}
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-3.5 bg-[#F8FAFC] text-xs font-mono text-[#64748B] uppercase tracking-wider hidden lg:grid">
            <span>Model & Repository</span>
            <span>Task Domain</span>
            <span>P50 Latency</span>
            <span>Security Audit</span>
            <span>Price / 1k Tokens</span>
            <span className="text-right">Action</span>
          </div>

          <AnimatePresence mode="sync">
            {filteredModels.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="group grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
              >
                {/* Model Name + Repo Copy */}
                <div>
                  <div className="font-sans font-bold text-sm text-black group-hover:text-[#0284C7] transition-colors flex items-center gap-2">
                    {m.name}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs text-[#64748B] truncate max-w-[280px]">
                      {m.hf}
                    </span>
                    <button
                      onClick={() => handleCopy(m.hf)}
                      className="text-[#94A3B8] hover:text-black transition-colors"
                      title="Copy Hugging Face Model ID"
                    >
                      {copiedId === m.hf ? (
                        <Check className="w-3.5 h-3.5 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Domain & Task Tag */}
                <div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-black uppercase">
                    {m.tag}
                  </span>
                  <div className="font-mono text-[0.68rem] text-[#64748B] mt-1">
                    CTX: {m.context}
                  </div>
                </div>

                {/* Latency */}
                <div className="font-mono text-xs text-black font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#0284C7]" />
                  {m.p50}ms
                </div>

                {/* Security Radar Score */}
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="font-mono text-xs font-bold text-[#10B981]">
                    {m.security}% SAFE
                  </span>
                </div>

                {/* Cost */}
                <div className="font-mono text-xs text-black font-semibold">
                  ${m.cost} <span className="text-[0.68rem] font-normal text-[#64748B]">/ 1k</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-start lg:justify-end gap-2">
                  <Link
                    href="/browse"
                    className="btn-solid-black py-1.5 px-3.5 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Test Drive</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CORE ARCHITECTURAL PILLARS (4 Distinct Modules)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 border-t border-[#E2E8F0] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#10B981]" />
            PLATFORM ARCHITECTURE // 4 CORE CAPABILITIES
          </span>
          <div className="flex-1 border-t border-dashed border-[#E2E8F0]" />
          <span className="font-mono text-xs text-[#64748B]">
            ENTERPRISE GRADE AI INFRASTRUCTURE
          </span>
        </div>
      </div>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.tag} href="/browse">
                <div className="bg-white p-7 border border-[#E2E8F0] rounded-lg hover:border-black transition-all hover:shadow-sm h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs tracking-wider text-[#64748B] uppercase">
                        {f.tag}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-lg text-black mb-2 group-hover:text-[#0284C7] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-[#475569] text-sm font-sans leading-relaxed mb-6">
                      {f.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
                    <span className="font-mono text-xs text-[#10B981] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {f.badge}
                    </span>
                    <span className="font-sans text-xs font-semibold text-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore Module <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER STATUS BAR
         ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#E2E8F0] bg-white py-5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between flex-wrap gap-4 text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-black">AgentHub AI</span>
            <span>//</span>
            <span>Hugging Face Hub Integration</span>
            <span>//</span>
            <span>CodeFury 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-black font-semibold">ALL GPU CLUSTERS OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}