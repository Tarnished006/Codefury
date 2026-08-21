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

// Load 3D Rotating Dotted Earth Globe
const OrchestratorGlobe = dynamic(() => import("./OrchestratorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[320px] sm:max-w-[420px] md:max-w-[500px] aspect-square flex items-center justify-center mx-auto">
      <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[0.65rem] text-[#64748B]">[ LOADING_EARTH_MESH... ]</span>
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
    desc: "Autonomous task broker that parses natural language goals, decomposes multi-stage DAGs, and hires specialized domain models automatically.",
    badge: "Autonomous DAG Routing",
  },
  {
    icon: GitCompare,
    tag: "PILLAR_02 // 3_WAY_STREAM",
    title: "Model Matchmaker Arena",
    desc: "Split-screen benchmarking interface. Stream inferences from 3 models concurrently to compare token velocity, cost, and qualitative output in real-time.",
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
    <div className="min-h-screen pt-16 overflow-x-hidden w-full">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP TELEMETRY STATUS HUD (Responsive)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-2">
        <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 sm:px-4 sm:py-2.5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-[#64748B]">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-black font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              GPU MESH: ACTIVE
            </span>
            <span className="text-[#CBD5E1] hidden xs:inline">|</span>
            <span>NODES: <strong className="text-black font-semibold">842 GPUs</strong></span>
            <span className="text-[#CBD5E1] hidden sm:inline">|</span>
            <span className="hidden sm:inline">THROUGHPUT: <strong className="text-black font-semibold">142.8M tok/day</strong></span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="bg-white border border-[#E2E8F0] px-2 py-0.5 rounded text-[0.68rem] text-black font-medium">
              HF HUB: SYNCED
            </span>
            <span className="bg-black text-white px-2 py-0.5 rounded text-[0.68rem] font-medium">
              DEMO ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Responsive 2-Col Layout
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-6 sm:pt-10 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center">

          {/* ── LEFT COLUMN: Typography & CTAs ── */}
          <div className="flex flex-col justify-center order-2 lg:order-1 text-left">

            {/* Architecture Version Badge */}
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-xs font-mono font-medium rounded-full shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                AgentHub v2.0
              </span>
              <span className="font-mono text-xs text-[#64748B]">
                // Autonomous Model Network
              </span>
            </div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-black text-[clamp(2.75rem,7vw,5rem)] text-black leading-[1.03] tracking-[-0.045em] mb-4 sm:mb-6"
            >
              agenthub
            </motion.h1>

            {/* Sub-headline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-black mb-4 font-sans"
            >
              The Global Standard for{" "}
              <span className="text-[#64748B] font-semibold">Autonomous Intelligence.</span>
            </motion.div>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-xl mb-6 sm:mb-8 font-sans"
            >
              Deploy, benchmark, and scale open-weight Hugging Face models across high-throughput GPU clusters with autonomous Meta-Agent task orchestration and automated OWASP red-team security audits.
            </motion.p>

            {/* Action Buttons (Mobile: full width stacks; Desktop: horizontal) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8 sm:mb-10 w-full sm:w-auto"
            >
              <a
                href="#model-catalog"
                className="btn-solid-black gap-2.5 group w-full sm:w-auto text-center"
              >
                <span>Enter Marketplace</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </a>

              <Link
                href="/browse"
                className="btn-outline gap-2 w-full sm:w-auto text-center"
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
                { label: "Free Wallet", val: "500 Credits" },
              ].map((item) => (
                <div key={item.label} className="bg-white p-2.5 sm:p-3.5">
                  <div className="text-[0.6rem] sm:text-[0.65rem] font-mono uppercase text-[#64748B] mb-0.5">{item.label}</div>
                  <div className="text-xs sm:text-sm font-sans font-bold text-black">{item.val}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Free-Floating Rotating Earth ── */}
          <div className="flex items-center justify-center order-1 lg:order-2 w-full py-4 lg:py-0">
            <OrchestratorGlobe />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION DIVIDER
         ═══════════════════════════════════════════════════════════════════ */}
      <div id="model-catalog" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3 sm:gap-4 border-t border-[#E2E8F0] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2 truncate">
            <Layers className="w-4 h-4 text-[#0284C7] shrink-0" />
            MODEL MARKETPLACE // HUGGING FACE
          </span>
          <div className="flex-1 border-t border-dashed border-[#E2E8F0]" />
          <span className="font-mono text-xs text-[#64748B] whitespace-nowrap">
            6 ENDPOINTS READY
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE MODEL CATALOG (Responsive Table & Cards)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-16">

        {/* Domain Filter Bar (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
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

        {/* Desktop View: Data Grid (Hidden on small screens) */}
        <div className="hidden lg:block border border-[#E2E8F0] bg-white rounded-lg overflow-hidden divide-y divide-[#E2E8F0] shadow-xs">
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-3.5 bg-[#F8FAFC] text-xs font-mono text-[#64748B] uppercase tracking-wider">
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
                className="group grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-4 hover:bg-[#F8FAFC] transition-colors"
              >
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

                <div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-black uppercase">
                    {m.tag}
                  </span>
                  <div className="font-mono text-[0.68rem] text-[#64748B] mt-1">
                    CTX: {m.context}
                  </div>
                </div>

                <div className="font-mono text-xs text-black font-semibold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#0284C7]" />
                  {m.p50}ms
                </div>

                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="font-mono text-xs font-bold text-[#10B981]">
                    {m.security}% SAFE
                  </span>
                </div>

                <div className="font-mono text-xs text-black font-semibold">
                  ${m.cost} <span className="text-[0.68rem] font-normal text-[#64748B]">/ 1k</span>
                </div>

                <div className="flex items-center justify-end">
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

        {/* Mobile View: High-Density Responsive Cards */}
        <div className="lg:hidden space-y-3">
          {filteredModels.map((m) => (
            <div
              key={m.id}
              className="border border-[#E2E8F0] bg-white rounded-lg p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-sans font-bold text-sm text-black flex items-center gap-1.5">
                    {m.name}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-[0.68rem] text-[#64748B] truncate max-w-[200px]">
                      {m.hf}
                    </span>
                    <button
                      onClick={() => handleCopy(m.hf)}
                      className="text-[#94A3B8] hover:text-black"
                    >
                      {copiedId === m.hf ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <span className="font-mono text-[0.68rem] font-semibold px-2 py-0.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded text-black uppercase">
                  {m.tag}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F1F5F9] text-xs font-mono">
                <div>
                  <span className="text-[0.62rem] text-[#64748B] block">LATENCY</span>
                  <strong className="text-black">{m.p50}ms</strong>
                </div>
                <div>
                  <span className="text-[0.62rem] text-[#64748B] block">SECURITY</span>
                  <strong className="text-[#10B981]">{m.security}%</strong>
                </div>
                <div>
                  <span className="text-[0.62rem] text-[#64748B] block">PRICE</span>
                  <strong className="text-black">${m.cost}</strong>
                </div>
              </div>

              <Link
                href="/browse"
                className="btn-solid-black w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>Test Drive Model</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CORE ARCHITECTURAL PILLARS (Responsive Grid)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center gap-3 sm:gap-4 border-t border-[#E2E8F0] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2 truncate">
            <Cpu className="w-4 h-4 text-[#10B981] shrink-0" />
            ARCHITECTURE // 4 CORE MODULES
          </span>
          <div className="flex-1 border-t border-dashed border-[#E2E8F0]" />
          <span className="font-mono text-xs text-[#64748B] whitespace-nowrap">
            ENTERPRISE GRADE
          </span>
        </div>
      </div>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.tag} href="/browse">
                <div className="bg-white p-5 sm:p-7 border border-[#E2E8F0] rounded-lg hover:border-black transition-all hover:shadow-xs h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="font-mono text-[0.68rem] tracking-wider text-[#64748B] uppercase">
                        {f.tag}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-base sm:text-lg text-black mb-2 group-hover:text-[#0284C7] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-[#475569] text-xs sm:text-sm font-sans leading-relaxed mb-6">
                      {f.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
                    <span className="font-mono text-xs text-[#10B981] font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {f.badge}
                    </span>
                    <span className="font-sans text-xs font-semibold text-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#64748B] text-center sm:text-left">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
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