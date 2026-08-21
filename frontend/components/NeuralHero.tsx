"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ArrowRight, Cpu, Shield, GitCompare, Code2, Activity, CheckCircle2 } from "lucide-react";

// Load 3D WebGL Globe client-side only
const OrchestratorGlobe = dynamic(() => import("./OrchestratorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[560px] aspect-square flex items-center justify-center">
      <div className="w-80 h-80 rounded-full border border-dashed border-[#E4E4E7] flex items-center justify-center">
        <span className="font-mono text-xs text-[#A1A1AA]">[ LOADING_MESH... ]</span>
      </div>
    </div>
  ),
});

const MODELS = [
  { id: "llama3",      name: "Llama 3 8B",      domain: "LLM",        ms: 42,  price: "0.12", hf: "meta-llama/Meta-Llama-3-8B-Instruct" },
  { id: "deepseek",    name: "DeepSeek Coder",   domain: "Code",       ms: 38,  price: "0.08", hf: "deepseek-ai/deepseek-coder-6.7b-instruct" },
  { id: "biomedlm",    name: "Med-LLaMA 3",      domain: "Healthcare", ms: 55,  price: "0.18", hf: "BioMistral/BioMistral-7B" },
  { id: "llava",       name: "LLaVA Vision",     domain: "Vision",     ms: 61,  price: "0.22", hf: "llava-hf/llava-1.5-7b-hf" },
  { id: "legalbert",   name: "LegalBERT",        domain: "Legal",      ms: 29,  price: "0.06", hf: "nlpaueb/legal-bert-base-uncased" },
  { id: "fingpt",      name: "FinGPT Forecast",  domain: "Finance",    ms: 35,  price: "0.10", hf: "FinGPT/fingpt-forecaster" },
  { id: "whisper",     name: "Whisper Large v3", domain: "Audio",      ms: 48,  price: "0.14", hf: "openai/whisper-large-v3" },
  { id: "mistral",     name: "Mistral 7B Inst",  domain: "LLM",        ms: 33,  price: "0.09", hf: "mistralai/Mistral-7B-Instruct-v0.3" },
];

const FEATURES = [
  { icon: Cpu,        label: "Meta-Agent Orchestrator",    desc: "Autonomous task routing layer. Breaks complex multi-step workflows down and delegates to specialized models.", tag: "INTENT_ROUTING",     href: "/browse" },
  { icon: GitCompare, label: "Model Matchmaker Arena",     desc: "Split-screen sandbox streaming 3 models simultaneously with live token throughput and cost comparisons.",       tag: "ARENA_STREAM",       href: "/arena" },
  { icon: Shield,     label: "OWASP Red-Team Auditor",     desc: "Visual Security Radar analyzing resistance to Prompt Injection, Task Hijacking, and Context Leakage.",        tag: "SECURITY_RADAR",     href: "/browse" },
  { icon: Code2,      label: "Live Code-to-Deploy Canvas", desc: "Browser-side interactive Monaco SDK canvas. Test your live deployed endpoint in Python or JavaScript.",       tag: "CODE_CANVAS",        href: "/browse" },
];

export default function NeuralHero() {
  return (
    <div className="min-h-screen pt-16">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP TELEMETRY HUD (Top-right corner HUD from reference)
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-6 flex justify-end">
        <div className="border border-[#E4E4E7] bg-white p-2.5 grid grid-cols-2 gap-x-6 gap-y-1 text-[0.65rem] font-mono text-[#71717A]">
          <div><span className="text-[#A1A1AA]">LAT</span> 37.7749° N</div>
          <div><span className="text-[#A1A1AA]">LNG</span> 122.4194° W</div>
          <div><span className="text-[#A1A1AA]">ALT</span> 0.021 KM</div>
          <div><span className="text-[#A1A1AA]">NODE</span> #1,247</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Pixel Perfect to Reference Image
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_560px] gap-8 items-center min-h-[580px]">

          {/* ── LEFT COLUMN: Typography & CTAs ── */}
          <div className="flex flex-col justify-center">

            {/* Protocol System Header with line */}
            <div className="flex items-center gap-3 mb-8">
              <span className="font-mono text-[0.68rem] tracking-widest text-[#71717A] uppercase">
                [ PROTOCOL_SYS_V2 ]
              </span>
              <div className="w-16 h-[1px] bg-[#E4E4E7]" />
              <span className="font-mono text-[0.68rem] tracking-widest text-[#A1A1AA]">
                0X4A_73_D0_C7
              </span>
            </div>

            {/* Main Title: agentnet */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-black text-[clamp(3.5rem,7.5vw,6.5rem)] text-black leading-none tracking-[-0.05em] mb-6"
            >
              agentnet
            </motion.h1>

            {/* Sub-headline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="text-2xl sm:text-3xl font-bold tracking-tight text-black mb-6"
            >
              The Global Standard for{" "}
              <span className="text-[#71717A] font-semibold">Autonomous Intelligence.</span>
            </motion.div>

            {/* Monospace uppercase microcopy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-mono text-[0.72rem] tracking-widest text-[#71717A] max-w-lg leading-relaxed uppercase mb-10"
            >
              DEPLOY, MONETIZE, AND SCALE AUTONOMOUS AGENTS ON A HIGH-PERFORMANCE X402 LIQUIDITY LAYER.
            </motion.p>

            {/* Main Solid Black Button */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex items-center gap-4 mb-10"
            >
              <Link
                href="/browse"
                className="btn-solid-black inline-flex items-center gap-4 group"
              >
                <span>ENTER MARKETPLACE</span>
                <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Status verification row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-6 text-[0.7rem] font-mono text-[#71717A]"
            >
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#EF4444]" />
                <span>1.2K NODES</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#71717A]" />
                <span>VERIFIED</span>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN: Interactive 3D Globe ── */}
          <div className="flex items-center justify-center">
            <OrchestratorGlobe />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION DIVIDER
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 border-t border-[#E4E4E7] pt-4 pb-8">
          <span className="bracket-label text-black">[ MODEL_MARKETPLACE_V1 ]</span>
          <div className="flex-1 border-t border-dashed border-[#E4E4E7]" />
          <span className="bracket-label">8 ENDPOINTS · HF_HUB_SYNC: ACTIVE</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODEL CATALOG TABLE
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-16">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 mb-2 px-4 text-[0.65rem] font-mono text-[#A1A1AA] uppercase tracking-wider hidden lg:grid">
          <span>MODEL_IDENTIFIER</span>
          <span>DOMAIN</span>
          <span>P50_LATENCY</span>
          <span>PRICE_1K_TOKENS</span>
          <span></span>
        </div>

        <div className="border border-[#E4E4E7] bg-white divide-y divide-[#E4E4E7]">
          {MODELS.map((m, i) => (
            <Link key={m.id} href="/browse">
              <div className="group grid grid-cols-1 lg:grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                <div>
                  <div className="font-sans font-bold text-sm text-black group-hover:text-black">
                    {m.name}
                  </div>
                  <div className="font-mono text-[0.65rem] text-[#71717A] mt-0.5">{m.hf}</div>
                </div>
                <div>
                  <span className="font-mono text-[0.65rem] font-semibold px-2 py-0.5 bg-[#F4F4F5] border border-[#E4E4E7] text-black uppercase">
                    {m.domain}
                  </span>
                </div>
                <div className="font-mono text-xs text-[#71717A]">{m.ms}ms</div>
                <div className="font-mono text-xs text-black font-semibold">${m.price}</div>
                <div className="flex items-center gap-1 text-[0.68rem] font-mono uppercase tracking-widest text-black group-hover:underline">
                  Inspect <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          PLATFORM MODULES
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-4 border-t border-[#E4E4E7] pt-4 pb-8">
          <span className="bracket-label text-black">[ SYSTEM_CAPABILITIES ]</span>
          <div className="flex-1 border-t border-dashed border-[#E4E4E7]" />
          <span className="bracket-label">4 MODULES ACTIVE</span>
        </div>
      </div>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-12 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px border border-[#E4E4E7] bg-[#E4E4E7]">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link key={f.tag} href={f.href}>
                <div className="bg-white p-6 hover:bg-[#FAFAFA] transition-colors h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="bracket-label text-black">[ {f.tag} ]</span>
                      <Icon className="w-4 h-4 text-black" />
                    </div>
                    <h3 className="font-sans font-bold text-base text-black mb-2">
                      {f.label}
                    </h3>
                    <p className="text-[#71717A] text-xs font-mono leading-relaxed mb-6">
                      {f.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[0.68rem] font-mono uppercase tracking-widest text-black font-semibold">
                    OPEN MODULE <ArrowRight className="w-3 h-3" />
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
      <footer className="border-t border-[#E4E4E7] bg-white py-4">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex items-center justify-between flex-wrap gap-4 text-[0.68rem] font-mono text-[#71717A]">
          <div className="flex items-center gap-4">
            <span className="font-bold text-black">agentnet</span>
            <span>//</span>
            <span>DEMO_MODE=true</span>
            <span>//</span>
            <span>BUILD: CODEFURY_2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-black font-semibold">ALL SYSTEMS NORMAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}