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

// Load 3D Neural Mesh Visualizer
const OrchestratorGlobe = dynamic(() => import("./OrchestratorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[540px] aspect-square flex items-center justify-center border border-[#E4E4E7] rounded-lg bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-[#71717A]">[ LOADING_MESH... ]</span>
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
    desc: "Autonomous task broker that parses natural language goals, calculates optimal sub-task DAGs, and hires specialized domain models across the marketplace.",
    badge: "Autonomous Task Routing",
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
    desc: "Automated vulnerability scanner generating a multi-axis Security Radar for Prompt Injection, Task Hijacking, and Context Extraction resistance.",
    badge: "Automated Audit Engine",
  },
  {
    icon: Code2,
    tag: "PILLAR_04 // INSTANT_EXECUTION",
    title: "Live Code-to-Deploy Canvas",
    desc: "In-browser Monaco SDK editor. Instantly test your newly generated API key with Python or TypeScript snippets running against live GPU clusters.",
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
        <div className="border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-4 text-[0.72rem] font-mono text-[#71717A]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-black font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              GLOBAL GPU MESH: ACTIVE
            </span>
            <span className="text-[#D4D4D8]">|</span>
            <span>NODES: <strong className="text-black font-semibold">842 GPUs</strong></span>
            <span className="text-[#D4D4D8]">|</span>
            <span>THROUGHPUT: <strong className="text-black font-semibold">142.8M tok/day</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white border border-[#E4E4E7] px-2.5 py-0.5 rounded text-black font-medium">
              HF HUB: SYNCED
            </span>
            <span className="bg-black text-white px-2.5 py-0.5 rounded font-medium">
              DEMO MODE: ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center min-h-[540px]">

          {/* ── LEFT COLUMN: Typography & Actions ── */}
          <div className="flex flex-col justify-center">

            {/* Architecture Version Pill */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white text-xs font-mono font-medium rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                NeuralBazaar v2.0
              </span>
              <span className="font-mono text-xs text-[#71717A]">
                // Open-Weight AI Marketplace
              </span>
            </div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-extrabold text-[clamp(2.7rem,5.2vw,4.5rem)] text-black leading-[1.05] tracking-[-0.04em] mb-6"
            >
              The AI Model<br />
              Marketplace &<br />
              <span className="text-[#0284C7] underline decoration-[#0284C7]/25 decoration-2 underline-offset-8">
                Autonomous Mesh.
              </span>
            </motion.h1>

            {/* Technical Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-base text-[#52525B] leading-relaxed max-w-xl mb-8 font-sans"
            >
              Discover, benchmark, and deploy open-weight Hugging Face models across high-throughput GPU clusters. Features real-time SSE token streaming, autonomous Meta-Agent task routing, and automated OWASP red-team security audits.
            </motion.p>

            {/* CTAs with Improved Font & No Emojis */}
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
                <span>Explore Model Catalog</span>
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

            {/* Spec Matrix */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-3 gap-px border border-[#E4E4E7] bg-[#E4E4E7] rounded-lg overflow-hidden"
            >
              {[
                { label: "P50 Latency", val: "38ms avg" },
                { label: "Security Audit", val: "OWASP Top 10" },
                { label: "Provisioned Wallet", val: "500 Credits" },
              ].map((item) => (
                <div key={item.label} className="bg-white p-3.5">
                  <div className="text-[0.65rem] font-mono uppercase text-[#71717A] mb-0.5">{item.label}</div>
                  <div className="text-sm font-sans font-bold text-black">{item.val}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Interactive 3D Mesh Visualizer ── */}
          <div className="flex flex-col items-center justify-center">
            <OrchestratorGlobe />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION DIVIDER
         ═══════════════════════════════════════════════════════════════════ */}
      <div id="model-catalog" className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 border-t border-[#E4E4E7] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7]" />
            MODEL MARKETPLACE // HUGGING FACE REPOSITORY
          </span>
          <div className="flex-1 border-t border-dashed border-[#E4E4E7]" />
          <span className="font-mono text-xs text-[#71717A]">
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
              className={`px-3.5 py-1.5 text-xs font-sans font-medium rounded-md transition-all whitespace-nowrap ${
                selectedDomain === domain
                  ? "bg-black text-white shadow-sm"
                  : "bg-[#F4F4F5] text-[#71717A] hover:text-black border border-[#E4E4E7]"
              }`}
            >
              {domain.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Model Data Table */}
        <div className="border border-[#E4E4E7] bg-white rounded-lg overflow-hidden divide-y divide-[#E4E4E7] shadow-xs">
          {/* Table Headers */}
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-3.5 bg-[#FAFAFA] text-xs font-mono text-[#71717A] uppercase tracking-wider hidden lg:grid">
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
                className="group grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-4 hover:bg-[#FAFAFA] transition-colors"
              >
                {/* Model Name + Repo Copy */}
                <div>
                  <div className="font-sans font-bold text-sm text-black group-hover:text-[#0284C7] transition-colors flex items-center gap-2">
                    {m.name}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs text-[#71717A] truncate max-w-[280px]">
                      {m.hf}
                    </span>
                    <button
                      onClick={() => handleCopy(m.hf)}
                      className="text-[#A1A1AA] hover:text-black transition-colors"
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
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded text-black uppercase">
                    {m.tag}
                  </span>
                  <div className="font-mono text-[0.68rem] text-[#71717A] mt-1">
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
                  ${m.cost} <span className="text-[0.68rem] font-normal text-[#71717A]">/ 1k</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-start lg:justify-end gap-2">
                  <Link
                    href="/browse"
                    className="btn-solid-black py-1.5 px-3.5 text-xs font-medium inline-flex items-center gap-1.5"
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
         ══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 border-t border-[#E4E4E7] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#10B981]" />
            PLATFORM ARCHITECTURE // 4 CORE CAPABILITIES
          </span>
          <div className="flex-1 border-t border-dashed border-[#E4E4E7]" />
          <span className="font-mono text-xs text-[#71717A]">
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
                <div className="bg-white p-7 border border-[#E4E4E7] rounded-lg hover:border-black transition-all hover:shadow-sm h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs tracking-wider text-[#71717A] uppercase">
                        {f.tag}
                      </span>
                      <div className="w-8 h-8 rounded bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-lg text-black mb-2 group-hover:text-[#0284C7] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-[#52525B] text-sm font-sans leading-relaxed mb-6">
                      {f.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#F4F4F5]">
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
      <footer className="border-t border-[#E4E4E7] bg-white py-5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between flex-wrap gap-4 text-xs font-mono text-[#71717A]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-black">NeuralBazaar AI</span>
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