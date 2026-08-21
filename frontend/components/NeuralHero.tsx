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
  CheckCircle,
  Activity,
  Layers,
  Play,
  Copy,
  Check
} from "lucide-react";

// Load 3D WebGL Globe client-side only
const OrchestratorGlobe = dynamic(() => import("./OrchestratorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[540px] aspect-square flex items-center justify-center">
      <div className="w-80 h-80 rounded-full border border-dashed border-[#E4E4E7] flex flex-col items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[0.65rem] text-[#71717A]">[ INITIALIZING_GPU_MESH... ]</span>
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
    tag: "Visual Question Answering",
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
    tag: "Financial Sentiment & Audit",
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
    desc: "Autonomous task broker. Type complex goals — the orchestrator decomposes sub-tasks, queries model capabilities, and delegates to optimal specialists.",
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
    desc: "Automated vulnerability scanner generating a multi-axis Security Radar for Prompt Injection, Task Hijacking, and Training Data Extraction resistance.",
    badge: "Automated Audit Engine",
  },
  {
    icon: Code2,
    tag: "PILLAR_04 // INSTANT_EXECUTION",
    title: "Live Code-to-Deploy Canvas",
    desc: "In-browser Monaco SDK editor. Instantly test your newly generated API key with Python or TypeScript snippets running against the live cluster.",
    badge: "Interactive SDK Playground",
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
        <div className="border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-[0.68rem] font-mono text-[#71717A]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-black font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              GLOBAL_GPU_MESH: ACTIVE
            </span>
            <span className="text-[#D4D4D8]">|</span>
            <span>NODES: <strong className="text-black">842 GPUs</strong></span>
            <span className="text-[#D4D4D8]">|</span>
            <span>THROUGHPUT: <strong className="text-black">142.8M tok/day</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white border border-[#E4E4E7] px-2 py-0.5 text-black font-semibold">
              HF_SYNC: 100% HEALTHY
            </span>
            <span className="bg-black text-white px-2 py-0.5 font-semibold">
              DEMO_MODE: ENABLED
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Clean High-Density Developer Aesthetic
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center min-h-[560px]">

          {/* ── LEFT COLUMN: Typography & Actions ── */}
          <div className="flex flex-col justify-center">

            {/* Architecture version tag */}
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white text-[0.65rem] font-mono font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                NEURAL_BAZAAR_V2
              </span>
              <span className="font-mono text-[0.68rem] tracking-wider text-[#71717A]">
                // OPEN_WEIGHT_AI_MARKETPLACE
              </span>
            </div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-black text-[clamp(2.8rem,5.5vw,4.6rem)] text-black leading-[1.04] tracking-[-0.04em] mb-6"
            >
              The AI Model<br />
              Marketplace &<br />
              <span className="text-[#0284C7] underline decoration-[#0284C7]/30 decoration-2 underline-offset-8">
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
              Discover, benchmark, and deploy open-weight Hugging Face models across global GPU clusters. Features real-time SSE token streaming, autonomous Meta-Agent task routing, and automated OWASP red-team security audits.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="flex flex-wrap items-center gap-3 mb-10"
            >
              <a
                href="#model-catalog"
                className="btn-solid-black inline-flex items-center gap-3 group"
              >
                <span>EXPLORE MODEL CATALOG</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/browse"
                className="btn-outline inline-flex items-center gap-2"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>LAUNCH ARENA (3-WAY)</span>
              </Link>
            </motion.div>

            {/* Spec Matrix Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-3 gap-px border border-[#E4E4E7] bg-[#E4E4E7]"
            >
              {[
                { label: "P50 INFERENCE", val: "38ms avg" },
                { label: "SECURITY AUDIT", val: "OWASP Top 10" },
                { label: "PROVISIONED WALLET", val: "500 Credits" },
              ].map((item) => (
                <div key={item.label} className="bg-white p-3">
                  <div className="text-[0.6rem] font-mono uppercase text-[#71717A] mb-0.5">{item.label}</div>
                  <div className="text-xs font-mono font-bold text-black">{item.val}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Interactive 3D Globe ── */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2 px-2">
              <span className="font-mono text-[0.65rem] text-[#71717A] font-semibold">
                [ 3D_GPU_ORCHESTRATION_MESH ]
              </span>
              <span className="font-mono text-[0.65rem] text-[#10B981] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                REAL-TIME TELEMETRY
              </span>
            </div>

            <OrchestratorGlobe />

            <div className="w-full flex items-center justify-between mt-2 px-2 text-[0.62rem] font-mono text-[#71717A]">
              <span>SF ➔ NYC ➔ LONDON ➔ MUMBAI ➔ TOKYO</span>
              <span className="text-black font-semibold">ROTATING LIVE</span>
            </div>
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
            MODEL_MARKETPLACE // HUGGING_FACE_ECOSYSTEM
          </span>
          <div className="flex-1 border-t border-dashed border-[#E4E4E7]" />
          <span className="font-mono text-[0.68rem] text-[#71717A]">
            6 CURATED ENDPOINTS READY
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          INTERACTIVE MODEL CATALOG (Domain Filter + High-Density Table)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">

        {/* Domain Filter Bar */}
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-2">
          {DOMAINS.map((domain) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-all whitespace-nowrap ${
                selectedDomain === domain
                  ? "bg-black text-white font-bold"
                  : "bg-[#F4F4F5] text-[#71717A] hover:text-black border border-[#E4E4E7]"
              }`}
            >
              {domain.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Model Data Table */}
        <div className="border border-[#E4E4E7] bg-white divide-y divide-[#E4E4E7]">
          {/* Table Headers */}
          <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_1fr] gap-4 items-center px-5 py-3 bg-[#FAFAFA] text-[0.65rem] font-mono text-[#71717A] uppercase tracking-wider hidden lg:grid">
            <span>MODEL & REPO</span>
            <span>DOMAIN / TASK</span>
            <span>P50 LATENCY</span>
            <span>SECURITY AUDIT</span>
            <span>PRICE / 1K TOKENS</span>
            <span className="text-right">QUICK ACTION</span>
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
                    <span className="font-mono text-[0.65rem] text-[#71717A] truncate max-w-[280px]">
                      {m.hf}
                    </span>
                    <button
                      onClick={() => handleCopy(m.hf)}
                      className="text-[#A1A1AA] hover:text-black transition-colors"
                      title="Copy Hugging Face Model ID"
                    >
                      {copiedId === m.hf ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Domain & Task Tag */}
                <div>
                  <span className="font-mono text-[0.65rem] font-bold px-2 py-0.5 bg-[#F4F4F5] border border-[#E4E4E7] text-black uppercase">
                    {m.tag}
                  </span>
                  <div className="font-mono text-[0.62rem] text-[#71717A] mt-1">
                    CTX: {m.context}
                  </div>
                </div>

                {/* Latency */}
                <div className="font-mono text-xs text-black font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#0284C7]" />
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
                  ${m.cost} <span className="text-[0.65rem] font-normal text-[#71717A]">/ 1k</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-start lg:justify-end gap-2">
                  <Link
                    href="/browse"
                    className="btn-solid-black py-1.5 px-3 text-[0.65rem] inline-flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5 fill-white" />
                    <span>TEST DRIVE</span>
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
        <div className="flex items-center gap-4 border-t border-[#E4E4E7] pt-8 pb-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#10B981]" />
            PLATFORM_ARCHITECTURE // 4_CORE_MODULES
          </span>
          <div className="flex-1 border-t border-dashed border-[#E4E4E7]" />
          <span className="font-mono text-[0.68rem] text-[#71717A]">
            BUILT FOR ENTERPRISE AI OPERATIONS
          </span>
        </div>
      </div>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-[#E4E4E7] bg-[#E4E4E7]">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.tag} href="/browse">
                <div className="bg-white p-7 hover:bg-[#FAFAFA] transition-colors h-full flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[0.65rem] tracking-wider text-[#71717A] uppercase">
                        {f.tag}
                      </span>
                      <div className="w-8 h-8 bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-lg text-black mb-2 group-hover:text-[#0284C7] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-[#52525B] text-xs font-sans leading-relaxed mb-6">
                      {f.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#F4F4F5]">
                    <span className="font-mono text-[0.65rem] text-[#10B981] font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {f.badge}
                    </span>
                    <span className="font-mono text-[0.68rem] uppercase tracking-wider text-black font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      EXPLORE <ArrowRight className="w-3 h-3" />
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
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between flex-wrap gap-4 text-[0.68rem] font-mono text-[#71717A]">
          <div className="flex items-center gap-4">
            <span className="font-bold text-black">NEURALBAZAAR AI</span>
            <span>//</span>
            <span>HUGGING_FACE_INTEGRATION</span>
            <span>//</span>
            <span>CODEFURY_HACKATHON</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-black font-semibold">ALL CLUSTERS OPERATIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}