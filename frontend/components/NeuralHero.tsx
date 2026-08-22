"use client";

import { useState, useEffect } from "react";
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
  Layers,
  Play,
  Copy,
  Check,
  Search,
  Activity,
  Bot,
  Terminal,
  Brain,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  AlertCircle,
  Wallet
} from "lucide-react";
import { fetchModels, purchaseModel, testModel, fetchProfileDetails } from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";

const OrchestratorGlobe = dynamic(() => import("./OrchestratorGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-[320px] sm:max-w-[420px] md:max-w-[500px] aspect-square flex items-center justify-center mx-auto">
      <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-none border border-dashed border-black/15 flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-[9px] text-black/40 uppercase tracking-widest">[ INITIALIZING_3D_MESH ]</span>
      </div>
    </div>
  ),
});

const DOMAINS = ["ALL DOMAINS", "LLM CHAT", "CODE GEN", "VISION AI", "HEALTHCARE", "FINANCE"];
const ITEMS_PER_PAGE = 10;

const FEATURES = [
  {
    num: "01",
    icon: Cpu,
    tag: "// INTENT_DECOMPOSITION",
    title: "Meta-Agent Orchestrator",
    desc: "Autonomous task supervisor (openai/gpt-oss-120b) that parses natural language goals, selects specialist models from 51 catalog repos, and decomposes multi-stage DAGs.",
    badge: "AUTONOMOUS DAG ROUTER",
    link: "/orchestrator"
  },
  {
    num: "02",
    icon: GitCompare,
    tag: "// MULTI_MODEL_STREAM",
    title: "Model Matchmaker Arena",
    desc: "3-way concurrent SSE streaming benchmark. Compare token velocity, TTFT latency, and specialized domain personas across all 51 models in real time.",
    badge: "REAL-TIME SSE BENCHMARK",
    link: "/arena"
  },
  {
    num: "03",
    icon: Shield,
    tag: "// RED_TEAM_SECURITY",
    title: "OWASP Red-Team Radar",
    desc: "Automated penetration testing engine. Fires 5 live adversarial attack probes (Prompt Injection, Jailbreak, Data Leakage) with LLM-as-a-Judge grading.",
    badge: "OWASP LLM TOP-10",
    link: "/security"
  },
  {
    num: "04",
    icon: Terminal,
    tag: "// DOCKER_SANDBOX_MCP",
    title: "Native Code Sandbox & MCP",
    desc: "Isolated Python subprocess sandbox with execution timeouts and Model Context Protocol (MCP) server support for direct Claude Desktop integration.",
    badge: "MCP SERVER READY",
    link: "/deployments"
  },
];

export default function NeuralHero() {
  const { user, credits, fetchBalance } = useAuthContext();
  const [selectedDomain, setSelectedDomain] = useState("ALL DOMAINS");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [purchasedModelIds, setPurchasedModelIds] = useState<string[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState<string | null>(null);

  // Modal State
  const [selectedPurchaseModel, setSelectedPurchaseModel] = useState<any | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const data = await fetchModels();
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
        }
      } catch (err) {
        console.error("Failed to load live models from API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadModels();
  }, []);

  useEffect(() => {
    if (user) {
      loadPurchasedModels();
    }
  }, [user]);

  async function loadPurchasedModels() {
    try {
      const data = await fetchProfileDetails();
      if (data && Array.isArray(data.purchased_models)) {
        setPurchasedModelIds(data.purchased_models.map((pm: any) => pm.model_id));
      }
    } catch (err) {
      console.error("Failed to load purchased models:", err);
    }
  }

  const openPurchaseModal = (m: any) => {
    setSelectedPurchaseModel(m);
    setPurchaseSuccess(false);
    setPurchaseError(null);
  };

  const closePurchaseModal = () => {
    setSelectedPurchaseModel(null);
    setPurchaseSuccess(false);
    setPurchaseError(null);
  };

  const confirmPurchase = async () => {
    if (!selectedPurchaseModel) return;
    const modelId = selectedPurchaseModel.id;
    setPurchaseLoading(modelId);
    setPurchaseError(null);
    try {
      await purchaseModel(modelId);
      setPurchasedModelIds((prev) => [...prev, modelId]);
      await fetchBalance();
      setPurchaseSuccess(true);
    } catch (err: any) {
      setPurchaseError(err.message || "Failed to purchase model access.");
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleTest = async (modelId: string) => {
    setTestLoading(modelId);
    try {
      await testModel(modelId);
      alert("Diagnostics verification test registered successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to run diagnostics test.");
    } finally {
      setTestLoading(null);
    }
  };

  const normalizeDomain = (d: string) => (d || "").replace("_", " ").toUpperCase();

  const filteredModels = models.filter((m) => {
    const domainMatch =
      selectedDomain === "ALL DOMAINS" ||
      normalizeDomain(m.domain) === normalizeDomain(selectedDomain);

    const searchMatch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.repo_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.task_tag || "").toLowerCase().includes(searchQuery.toLowerCase());

    return domainMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedModels = filteredModels.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document.getElementById("model-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCopy = (repo: string) => {
    navigator.clipboard.writeText(repo);
    setCopiedId(repo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="relative min-h-screen pt-16 overflow-x-hidden w-full bg-white">

      {/* ── Ambient Background Glow Halos (AgentNet signature) ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] bg-[#FF4500]/10 -top-[10%] -left-[5%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] bg-black/5 -bottom-[10%] -right-[5%]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — Split 2-Column Architectural Layout
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-[1600px] mx-auto px-6 lg:px-12 border-x border-black/10 min-h-[calc(100vh-64px)] flex flex-col justify-between">

        {/* ── Top Floating Telemetry HUD (Coordinates) ── */}
        <div className="absolute top-8 right-6 lg:right-12 hidden md:flex flex-col gap-2 pointer-events-none select-none">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-black/30 w-8">LAT</span>
            <div className="w-[1px] h-3 bg-black/20" />
            <span className="font-mono text-[9px] text-black/60">37.7749° N</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-black/30 w-8">LNG</span>
            <div className="w-[1px] h-3 bg-black/20" />
            <span className="font-mono text-[9px] text-black/60">122.4194° W</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-black/30 w-8">NODES</span>
            <div className="w-[1px] h-3 bg-black/20" />
            <span className="font-mono text-[9px] text-[#FF4500] font-bold">51 CLUSTERS</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-black/10 pt-8 sm:pt-14 pb-16 items-center">

          {/* ── LEFT COLUMN: Typography & CTAs ── */}
          <div className="flex flex-col justify-center lg:border-r border-black/10 lg:pr-12">

            {/* Protocol Badge */}
            <div className="flex items-center gap-4 mb-6 font-mono text-[9px] text-black/40 uppercase tracking-[0.35em]">
              <span className="text-[#FF4500] font-bold">[ PROTOCOL_SYS_V2 ]</span>
              <div className="h-[1px] w-8 bg-black/20" />
              <span>0x4A_73_96_C7</span>
            </div>

            {/* Main Logo Title */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-sans font-extrabold text-[14vw] sm:text-[10vw] lg:text-[7vw] leading-[0.95] tracking-[-0.05em] text-black mb-6"
            >
              agentnet
            </motion.h1>

            {/* Sub-headline */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-sans font-extrabold tracking-tight leading-[1.15] mb-4 text-black"
            >
              The Global Standard for<br />
              <span className="text-black/40">Autonomous Intelligence.</span>
            </motion.h2>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="font-mono text-xs leading-relaxed text-black/60 uppercase max-w-lg mb-8"
            >
              Deploy, benchmark, and orchestrate 51 open-weight AI models with Groq-powered supervisor intelligence, real-time 3-way arena streaming, and live OWASP security red-teaming.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8"
            >
              <a
                href="#model-catalog"
                className="group flex items-center justify-between gap-8 bg-black text-white px-8 py-4 border border-black hover:bg-[#FF4500] hover:border-[#FF4500] transition-all duration-500 font-mono text-[10px] font-bold uppercase tracking-[0.2em]"
              >
                <span>Enter Marketplace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <Link
                href="/arena"
                className="flex items-center justify-center gap-2 border border-black/20 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all duration-300"
              >
                <GitCompare className="w-4 h-4 text-[#FF4500]" />
                <span>Launch Arena</span>
              </Link>
            </motion.div>

            {/* Live Indicators */}
            <div className="flex gap-6 font-mono text-[9px] uppercase tracking-widest text-black/50">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF4500]" />
                {models.length || 51} Live Endpoints
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                OWASP Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
                Sub-40ms P50
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Interactive 3D Dotted Globe ── */}
          <div className="flex items-center justify-center lg:pl-12 pt-8 lg:pt-0">
            <OrchestratorGlobe />
          </div>
        </div>

        {/* ── Marquee Protocol Ticker ── */}
        <div className="border-t border-black/10 overflow-hidden bg-white/60 backdrop-blur-sm -mx-6 lg:-mx-12 py-2.5">
          <div className="flex whitespace-nowrap animate-[marquee_30s_linear_infinite]">
            {[
              "X402 PROTOCOL",
              "AUTONOMOUS AGENTS",
              "ZERO PLATFORM FEE",
              "GROQ LPU ORCHESTRATION",
              "REAL-TIME ARENA SSE",
              "OWASP TOP-10 SECURITY",
              "MCP SERVER INTERFACE",
              "51 VERIFIED MODELS",
              "BASE SEPOLIA IDENTITY",
              "X402 PROTOCOL",
              "AUTONOMOUS AGENTS",
              "ZERO PLATFORM FEE",
              "GROQ LPU ORCHESTRATION",
              "REAL-TIME ARENA SSE",
              "OWASP TOP-10 SECURITY",
              "MCP SERVER INTERFACE",
              "51 VERIFIED MODELS",
            ].map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-4 px-6 font-mono text-[8px] uppercase tracking-[0.35em] text-black/40">
                {item}
                <span className="w-1 h-1 rounded-full bg-[#FF4500] flex-shrink-0" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: 4 CORE ARCHITECTURAL PILLARS (Numbered Grid)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 px-6 lg:px-12 max-w-[1600px] mx-auto border-x border-black/10 bg-white">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-black/10 pb-6 gap-4">
          <div>
            <p className="font-mono text-[10px] text-black/50 uppercase tracking-[0.4em] mb-2">
              // Platform_Architecture
            </p>
            <h2 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tighter text-black">
              core pillars.
            </h2>
          </div>
          <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
            Production Ready Engine · CodeFury 2026
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-black/10">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.num}
                href={f.link}
                className="border-r border-b border-black/10 p-8 group hover:bg-black/[0.02] transition-colors duration-500 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <span className="font-sans font-extrabold text-6xl text-black/8 leading-none select-none group-hover:text-black/15 transition-colors">
                      {f.num}
                    </span>
                    <div className="w-10 h-10 border border-black/15 flex items-center justify-center group-hover:border-[#FF4500] group-hover:bg-[#FF4500]/5 transition-all duration-300">
                      <Icon className="w-4 h-4 text-black/60 group-hover:text-[#FF4500] transition-colors" />
                    </div>
                  </div>
                  <h3 className="font-sans font-bold text-lg text-black mb-2 leading-snug">
                    {f.title}
                  </h3>
                  <p className="font-sans text-xs text-black/60 leading-relaxed mb-6">
                    {f.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-black/5">
                  <div className="w-1.5 h-1.5 bg-[#FF4500]" />
                  <span className="font-mono text-[9px] text-[#FF4500] uppercase tracking-widest font-bold">
                    {f.badge}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: MODEL CATALOG (51 Verified Repositories)
         ═══════════════════════════════════════════════════════════════════ */}
      <section id="model-catalog" className="relative py-20 px-6 lg:px-12 max-w-[1600px] mx-auto border-x border-black/10 bg-white">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-black/10 pb-6 gap-4">
          <div>
            <p className="font-mono text-[10px] text-black/50 uppercase tracking-[0.4em] mb-2">
              // Model_Registry
            </p>
            <h2 className="font-sans font-extrabold text-4xl sm:text-5xl tracking-tighter text-black">
              verified models.
            </h2>
          </div>
          <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
            {filteredModels.length} of {models.length || 51} models · page {safeCurrentPage}/{totalPages}
          </span>
        </div>

        {/* Domain Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {DOMAINS.map((domain) => (
              <button
                key={domain}
                onClick={() => { setSelectedDomain(domain); setCurrentPage(1); }}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedDomain === domain
                    ? "bg-black text-white"
                    : "bg-black/[0.02] text-black/50 hover:text-black border border-black/10"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-3.5 h-3.5 text-black/40 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="SEARCH MODEL, REPO, TASK..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-black/15 bg-black/[0.015] text-xs font-mono text-black uppercase tracking-wider outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Desktop Data Grid */}
        <div className="hidden lg:block border border-black/10 bg-white overflow-hidden divide-y divide-black/10">
          <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.6fr_1.8fr] gap-4 items-center px-6 py-3.5 bg-black/[0.02] text-[10px] font-mono font-bold text-black/50 uppercase tracking-widest">
            <span>Model & Hugging Face Repo</span>
            <span>Domain & Task</span>
            <span>P50 Latency</span>
            <span>OWASP Safety</span>
            <span>Price / 1k</span>
            <span className="text-right">Action</span>
          </div>

          <AnimatePresence mode="sync">
            {paginatedModels.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="group grid grid-cols-[1.4fr_1fr_0.7fr_0.8fr_0.6fr_1.8fr] gap-4 items-center px-6 py-4 hover:bg-black/[0.015] transition-colors"
              >
                <div>
                  <div className="font-sans font-bold text-sm text-black group-hover:text-[#FF4500] transition-colors flex items-center gap-2">
                    {m.name}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[11px] text-black/50 truncate max-w-[240px]">
                      {m.repo_id}
                    </span>
                    {m.creator_id && (
                      <span className="font-mono text-[9px] text-[#FF4500] font-bold uppercase tracking-wider select-none px-1.5 py-0.2 bg-[#FF4500]/5 border border-[#FF4500]/10 shrink-0">
                        by @{m.creator_name || "Independent"}
                      </span>
                    )}
                    <button
                      onClick={() => handleCopy(m.repo_id)}
                      className="text-black/30 hover:text-black transition-colors"
                      title="Copy Repo ID"
                    >
                      {copiedId === m.repo_id ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-black/[0.03] border border-black/10 text-black uppercase">
                    {m.task_tag}
                  </span>
                  <div className="font-mono text-[10px] text-black/40 mt-1 uppercase">
                    CTX: {m.context_length ? `${m.context_length.toLocaleString()} tok` : "8,192 tok"}
                  </div>
                </div>

                <div className="font-mono text-xs text-black font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
                  {m.p50_latency_ms || 38}ms
                </div>

                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="font-mono text-xs font-bold text-[#10B981]">
                    {m.security_score || 98}% SAFE
                  </span>
                </div>

                <div className="font-mono text-xs text-black font-bold">
                  ${m.price_per_1k ? m.price_per_1k.toFixed(2) : "0.12"}{" "}
                  <span className="text-[10px] font-normal text-black/40">/ 1k</span>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {purchasedModelIds.includes(m.id) ? (
                    <>
                      <span className="font-mono text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 uppercase">
                        Purchased
                      </span>
                      <button
                        onClick={() => handleTest(m.id)}
                        disabled={testLoading === m.id}
                        className="px-2.5 py-1.5 bg-black text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#FF4500] transition-colors disabled:opacity-50"
                      >
                        {testLoading === m.id ? "Testing..." : "Test Model"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openPurchaseModal(m)}
                      className="px-2.5 py-1.5 bg-[#FF4500] text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-black transition-colors"
                    >
                      Buy Model (100 CR)
                    </button>
                  )}
                  <Link
                    href={`/arena?model=${encodeURIComponent(m.id)}`}
                    className="btn-solid-black py-1.5 px-2.5 text-[9px] font-mono font-bold uppercase tracking-widest inline-flex items-center gap-1"
                  >
                    <Play className="w-2.5 h-2.5 fill-white" />
                    <span>Benchmark</span>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Desktop Pagination Controls */}
        {totalPages > 1 && (
          <div className="hidden lg:flex items-center justify-between mt-4 pt-4 border-t border-black/10">
            <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
              Showing {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredModels.length)} of {filteredModels.length} models
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="w-8 h-8 flex items-center justify-center border border-black/15 text-black/50 hover:border-black hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 flex items-center justify-center font-mono text-xs font-bold transition-all border ${
                    page === safeCurrentPage
                      ? "bg-black text-white border-black"
                      : "border-black/15 text-black/50 hover:border-black hover:text-black"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-black/15 text-black/50 hover:border-black hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {paginatedModels.map((m) => (
            <div
              key={m.id}
              className="border border-black/10 bg-white p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-sans font-bold text-sm text-black flex items-center gap-1.5">
                    {m.name}
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="font-mono text-[10px] text-black/50 truncate max-w-[200px] mt-1">
                    {m.repo_id}
                  </div>
                  {m.creator_id && (
                    <div className="mt-1">
                      <span className="font-mono text-[8px] text-[#FF4500] font-bold uppercase tracking-wider select-none px-1.5 py-0.2 bg-[#FF4500]/5 border border-[#FF4500]/10 inline-block">
                        by @{m.creator_name || "Independent"}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-black/[0.03] border border-black/10 uppercase">
                  {m.task_tag}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/5 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-black/40 block uppercase">LATENCY</span>
                  <strong className="text-black">{m.p50_latency_ms || 38}ms</strong>
                </div>
                <div>
                  <span className="text-[9px] text-black/40 block uppercase">SECURITY</span>
                  <strong className="text-[#10B981]">{m.security_score || 98}%</strong>
                </div>
                <div>
                  <span className="text-[9px] text-black/40 block uppercase">PRICE</span>
                  <strong className="text-black">${m.price_per_1k ? m.price_per_1k.toFixed(2) : "0.12"}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-black/5">
                <div className="flex gap-2">
                  {purchasedModelIds.includes(m.id) ? (
                    <>
                      <div className="flex-1 flex items-center justify-center font-mono text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 uppercase py-2">
                        Purchased
                      </div>
                      <button
                        onClick={() => handleTest(m.id)}
                        disabled={testLoading === m.id}
                        className="flex-1 py-2 bg-black text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-[#FF4500] transition-colors disabled:opacity-50"
                      >
                        {testLoading === m.id ? "Testing..." : "Test Model"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openPurchaseModal(m)}
                      className="w-full py-2 bg-[#FF4500] text-white text-[9px] font-mono font-bold uppercase tracking-widest hover:bg-black transition-colors"
                    >
                      Buy Model (100 CR)
                    </button>
                  )}
                </div>

                <Link
                  href={`/arena?model=${encodeURIComponent(m.id)}`}
                  className="btn-solid-black w-full py-2 text-[9px] flex items-center justify-center gap-1"
                >
                  <Play className="w-2.5 h-2.5 fill-white" />
                  <span>Benchmark Model</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Pagination Controls */}
        {totalPages > 1 && (
          <div className="lg:hidden flex items-center justify-between mt-6 pt-4 border-t border-black/10">
            <span className="font-mono text-[10px] text-black/40 uppercase">
              Page {safeCurrentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                disabled={safeCurrentPage === 1}
                className="flex items-center gap-1 px-3 py-2 border border-black/15 font-mono text-[10px] font-bold uppercase text-black/50 hover:border-black hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                disabled={safeCurrentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 border border-black/15 font-mono text-[10px] font-bold uppercase text-black/50 hover:border-black hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: MODEL ACCESS & PURCHASE AUTHORIZATION GATEWAY
         ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPurchaseModel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePurchaseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className="relative w-full max-w-lg bg-white border-2 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden"
            >
              {/* Header Bar */}
              <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                    MODEL_ACCESS // CHECKOUT_GATEWAY
                  </span>
                </div>
                <button
                  onClick={closePurchaseModal}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 sm:p-8 space-y-6">
                {purchaseSuccess ? (
                  /* Success State */
                  <div className="text-center py-4 space-y-5">
                    <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-sans font-extrabold text-2xl text-black">
                        Access Authorized!
                      </h3>
                      <p className="font-mono text-xs text-black/60 mt-1 uppercase tracking-wider">
                        Persistent license granted for {selectedPurchaseModel.name}
                      </p>
                    </div>
                    <div className="bg-black/[0.02] border border-black/10 p-4 text-left font-mono text-xs space-y-2">
                      <div className="flex justify-between text-black/60">
                        <span>REPOSITORY:</span>
                        <span className="font-bold text-black">{selectedPurchaseModel.repo_id}</span>
                      </div>
                      <div className="flex justify-between text-black/60">
                        <span>STATUS:</span>
                        <span className="font-bold text-emerald-600">ONLINE & PERMITTED</span>
                      </div>
                      <div className="flex justify-between text-black/60">
                        <span>REMAINING BALANCE:</span>
                        <span className="font-bold text-black">{credits} CR</span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Link
                        href={`/arena?model=${encodeURIComponent(selectedPurchaseModel.id)}`}
                        onClick={closePurchaseModal}
                        className="flex-1 py-3 bg-[#FF4500] text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Benchmark in Arena</span>
                      </Link>
                      <button
                        onClick={closePurchaseModal}
                        className="flex-1 py-3 border border-black font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-black/[0.04] transition-colors"
                      >
                        Close Window
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Purchase State */
                  <>
                    {/* Model Details Header */}
                    <div className="border-b border-black/10 pb-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="font-mono text-[9px] font-bold text-[#FF4500] uppercase tracking-widest block mb-1">
                            // VERIFIED_MODEL_PROFILE
                          </span>
                          <h3 className="font-sans font-extrabold text-2xl text-black tracking-tight flex items-center gap-2">
                            {selectedPurchaseModel.name}
                            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                          </h3>
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2.5 py-1 bg-black/[0.04] border border-black/10 uppercase shrink-0">
                          {selectedPurchaseModel.task_tag}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-black/50 truncate">
                        {selectedPurchaseModel.repo_id}
                      </div>
                      {selectedPurchaseModel.creator_id && (
                        <div className="mt-2">
                          <span className="font-mono text-[9px] text-[#FF4500] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FF4500]/5 border border-[#FF4500]/10 inline-block">
                            by @{selectedPurchaseModel.creator_name || "Independent"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Spec Grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="border border-black/10 p-3 bg-black/[0.015]">
                        <span className="font-mono text-[9px] text-black/40 uppercase block mb-1">LATENCY P50</span>
                        <div className="font-mono text-sm font-extrabold text-black flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#FF4500]" />
                          {selectedPurchaseModel.p50_latency_ms || 38}ms
                        </div>
                      </div>
                      <div className="border border-black/10 p-3 bg-black/[0.015]">
                        <span className="font-mono text-[9px] text-black/40 uppercase block mb-1">SECURITY</span>
                        <div className="font-mono text-sm font-extrabold text-[#10B981] flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />
                          {selectedPurchaseModel.security_score || 98}%
                        </div>
                      </div>
                      <div className="border border-black/10 p-3 bg-black/[0.015]">
                        <span className="font-mono text-[9px] text-black/40 uppercase block mb-1">CONTEXT</span>
                        <div className="font-mono text-sm font-extrabold text-black">
                          {selectedPurchaseModel.context_length ? `${selectedPurchaseModel.context_length.toLocaleString()}` : "8,192"}
                        </div>
                      </div>
                    </div>

                    {/* Ledger Breakdown Card */}
                    <div className="bg-black/[0.02] border border-black/10 p-5 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between text-black/60 pb-2 border-b border-black/5">
                        <span>UNLOCK LICENSE FEE:</span>
                        <span className="font-bold text-black">
                          100.00 CR (${(100 * 0.01).toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-black/60 pb-2 border-b border-black/5">
                        <span>YOUR WALLET BALANCE:</span>
                        <span className="font-bold text-black flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-[#FF4500]" />
                          {credits} CR
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-black/80 font-bold pt-1">
                        <span>BALANCE AFTER UNLOCK:</span>
                        <span className={credits >= 100 ? "text-black font-extrabold" : "text-red-500 font-extrabold"}>
                          {(credits - 100).toFixed(1)} CR
                        </span>
                      </div>
                    </div>

                    {/* Error Banner */}
                    {purchaseError && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-mono text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{purchaseError}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      {credits < 100 ? (
                        <div className="w-full space-y-2">
                          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Insufficient credit balance. Top up your wallet to continue.</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href="/wallet"
                              onClick={closePurchaseModal}
                              className="flex-1 py-3 bg-black text-white font-mono text-xs font-bold uppercase tracking-widest text-center hover:bg-[#FF4500] transition-colors"
                            >
                              Deposit Credits
                            </Link>
                            <button
                              onClick={closePurchaseModal}
                              className="px-5 py-3 border border-black/20 font-mono text-xs font-bold uppercase text-black hover:border-black transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={confirmPurchase}
                            disabled={purchaseLoading === selectedPurchaseModel.id}
                            className="flex-1 py-3.5 bg-[#FF4500] text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>
                              {purchaseLoading === selectedPurchaseModel.id
                                ? "Processing Transaction..."
                                : "Authorize & Unlock (100 CR)"}
                            </span>
                          </button>
                          <button
                            onClick={closePurchaseModal}
                            disabled={purchaseLoading === selectedPurchaseModel.id}
                            className="px-6 py-3.5 border border-black font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-black/[0.04] transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}