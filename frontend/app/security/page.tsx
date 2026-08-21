"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle,
  ChevronDown, Search, Cpu, Zap, FileCheck2,
  RefreshCw, CheckCircle2, XCircle, Loader2, Info
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { fetchModels, fetchModelAudit } from "@/lib/api";

const DOMAINS = ["ALL DOMAINS", "LLM CHAT", "CODE GEN", "VISION AI", "HEALTHCARE", "FINANCE"];

const PROBE_LABELS: Record<string, string> = {
  prompt_injection:     "Prompt Injection",
  jailbreak_resistance: "Jailbreak Resistance",
  task_hijacking:       "Task Hijacking",
  data_leakage:         "Data Leakage",
  context_manipulation: "Context Manipulation",
};

const AXIS_COLORS: Record<string, string> = {
  prompt_injection:     "#EF4444",
  jailbreak_resistance: "#F59E0B",
  task_hijacking:       "#8B5CF6",
  data_leakage:         "#0284C7",
  context_manipulation: "#10B981",
};

export default function SecurityPage() {
  const [models, setModels]           = useState<any[]>([]);
  const [domainFilter, setDomainFilter] = useState("ALL DOMAINS");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [audit, setAudit]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [probeProgress, setProbeProgress] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load all models on mount
  useEffect(() => {
    fetchModels().then((data: any[]) => {
      setModels(data || []);
      if (data?.length > 0) setSelectedModel(data[0]);
    }).catch(console.error);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredModels = models.filter(m => {
    const domainMatch = domainFilter === "ALL DOMAINS" ||
      m.domain.replace("_", " ").toUpperCase() === domainFilter;
    const searchMatch = !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.repo_id.toLowerCase().includes(searchQuery.toLowerCase());
    return domainMatch && searchMatch;
  });

  const runAudit = async () => {
    if (!selectedModel || loading) return;
    setLoading(true);
    setAudit(null);
    setProbeProgress([]);

    // Animate probe dispatch messages while the real API call runs
    const probeNames = [
      "Dispatching Prompt Injection probe...",
      "Dispatching Jailbreak Resistance probe...",
      "Dispatching Task Hijacking probe...",
      "Dispatching Data Leakage probe...",
      "Dispatching Context Manipulation probe...",
      "Forwarding responses to Groq LLM-as-a-Judge...",
      "Parsing safety scores + reasoning...",
    ];
    let i = 0;
    const ticker = setInterval(() => {
      if (i < probeNames.length) {
        setProbeProgress(prev => [...prev, probeNames[i]]);
        i++;
      } else {
        clearInterval(ticker);
      }
    }, 900);

    try {
      const data = await fetchModelAudit(selectedModel.id);
      clearInterval(ticker);
      setAudit(data);
      setProbeProgress([]);
    } catch (e) {
      clearInterval(ticker);
      setProbeProgress(["Error connecting to audit engine. Check backend is running."]);
    } finally {
      setLoading(false);
    }
  };

  const getScore = (axis: string) => {
    if (!audit) return 0;
    return audit.scores?.[axis] ?? audit[`${axis}_score`] ?? 0;
  };

  const getRadarPoints = () => {
    if (!audit) return "";
    const axes = ["prompt_injection","jailbreak_resistance","task_hijacking","data_leakage","context_manipulation"];
    const center = 130, radius = 100;
    return axes.map((axis, i) => {
      const r = (getScore(axis) / 100) * radius;
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
  };

  const overallScore = audit?.overall_score ?? 0;
  const overallColor = overallScore >= 90 ? "#10B981" : overallScore >= 70 ? "#F59E0B" : "#EF4444";

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-mono bg-[#10B981] text-white font-bold">OWASP_LLM_TOP_10</span>
              <span className="font-mono text-xs text-[#64748B]">// LLM-as-a-Judge Red-Team Auditor via Groq</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              AI Security Radar
            </h1>
            <p className="text-sm text-[#64748B] mt-1 font-sans">
              Select any model → Groq fires 5 adversarial probes in real-time → LLM-as-a-Judge scores containment.
            </p>
          </div>
          {audit && (
            <div
              className="font-mono text-sm font-bold px-4 py-2 rounded-lg border"
              style={{ color: overallColor, borderColor: overallColor, background: `${overallColor}15` }}
            >
              {overallScore}% OVERALL SAFE
            </div>
          )}
        </div>

        {/* ── Model Selector Panel ── */}
        <div className="border border-[#E2E8F0] bg-white rounded-lg p-5 mb-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <span className="font-mono text-xs font-bold text-black uppercase shrink-0">
              TARGET MODEL
            </span>

            {/* Domain filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {DOMAINS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDomainFilter(d); setDropdownOpen(true); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${
                    domainFilter === d
                      ? "bg-black text-white"
                      : "bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] hover:text-black"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Searchable model dropdown */}
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-3 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg px-4 py-2.5 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield className="w-4 h-4 text-[#10B981] shrink-0" />
                  {selectedModel ? (
                    <div className="min-w-0">
                      <div className="text-sm font-sans font-bold text-black truncate">{selectedModel.name}</div>
                      <div className="text-xs font-mono text-[#64748B] truncate">{selectedModel.repo_id}</div>
                    </div>
                  ) : (
                    <span className="text-sm text-[#64748B]">Select a model to audit...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-[#E2E8F0] rounded-lg shadow-xl overflow-hidden">
                  {/* Search input */}
                  <div className="p-2 border-b border-[#F1F5F9]">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search by name or repo..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-[#E2E8F0] rounded bg-[#F8FAFC] outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  {/* Model list */}
                  <div className="max-h-64 overflow-y-auto divide-y divide-[#F1F5F9]">
                    {filteredModels.length === 0 ? (
                      <div className="p-4 text-xs font-mono text-[#64748B] text-center">No models match filter</div>
                    ) : filteredModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m); setDropdownOpen(false); setAudit(null); }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors flex items-center gap-3 ${
                          selectedModel?.id === m.id ? "bg-[#F0FDF4]" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-sans font-bold text-black">{m.name}</div>
                          <div className="text-[0.65rem] font-mono text-[#64748B] truncate">{m.repo_id}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[0.6rem] font-mono px-1.5 py-0.5 bg-[#F1F5F9] rounded text-[#475569] uppercase">
                            {m.domain}
                          </span>
                          {selectedModel?.id === m.id && (
                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Launch audit button */}
            <button
              onClick={runAudit}
              disabled={!selectedModel || loading}
              className="btn-solid-black gap-2 px-6 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Run Live Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Selected model metadata strip */}
          {selectedModel && (
            <div className="mt-4 pt-4 border-t border-[#F1F5F9] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[0.62rem] text-[#64748B] block">DOMAIN</span>
                <strong className="text-black">{selectedModel.domain}</strong>
              </div>
              <div>
                <span className="text-[0.62rem] text-[#64748B] block">TASK</span>
                <strong className="text-black">{selectedModel.task_tag}</strong>
              </div>
              <div>
                <span className="text-[0.62rem] text-[#64748B] block">CONTEXT</span>
                <strong className="text-black">{selectedModel.context_length?.toLocaleString()} tok</strong>
              </div>
              <div>
                <span className="text-[0.62rem] text-[#64748B] block">HF REPO</span>
                <strong className="text-black truncate block">{selectedModel.repo_id}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ── Probe Progress Log (while loading) ── */}
        {loading && probeProgress.length > 0 && (
          <div className="border border-[#E2E8F0] bg-[#0F172A] rounded-lg p-5 mb-8 font-mono text-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[#10B981] font-bold">GROQ_RED_TEAM_ENGINE // LIVE</span>
            </div>
            <div className="space-y-1.5">
              {probeProgress.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-[#94A3B8]">
                  <span className="text-[#10B981]">›</span>
                  <span>{msg}</span>
                  {i === probeProgress.length - 1 && (
                    <Loader2 className="w-3 h-3 animate-spin text-[#10B981]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !audit && (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-[#E2E8F0] rounded-lg bg-[#FAFAFA] text-center">
            <Shield className="w-10 h-10 text-[#CBD5E1] mb-3" />
            <p className="font-mono text-sm text-[#64748B] font-bold">SELECT A MODEL + CLICK "RUN LIVE AUDIT"</p>
            <p className="text-xs font-mono text-[#94A3B8] mt-1">
              Groq (`openai/gpt-oss-120b`) will fire 5 adversarial probes and return real safety scores.
            </p>
          </div>
        )}

        {/* ── Audit Results ── */}
        {audit && !loading && (
          <div className="space-y-6">

            {/* Evaluated-by badge */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
                <Cpu className="w-3.5 h-3.5" />
                Evaluated by: <strong className="text-black">{audit.evaluated_by || "Groq LPU"}</strong>
              </span>
              <span className="text-[#CBD5E1]">|</span>
              <span className="text-xs font-mono text-[#64748B]">
                Repo: <strong className="text-black">{audit.repo_id || selectedModel?.repo_id}</strong>
              </span>
              <button onClick={runAudit} className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-black transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                Re-run Audit
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6 items-start">

              {/* ── LEFT: SVG Radar Chart ── */}
              <div className="border border-[#E2E8F0] bg-white rounded-lg p-6 flex flex-col items-center shadow-xs">
                <div className="flex items-center justify-between w-full mb-4">
                  <span className="font-mono text-xs font-bold text-black uppercase">MULTI_AXIS_SECURITY_RADAR</span>
                  <span className="font-mono text-xs font-bold" style={{ color: overallColor }}>
                    {overallScore}% SAFE
                  </span>
                </div>

                <div className="relative w-[260px] h-[260px] flex items-center justify-center">
                  <svg width="260" height="260" viewBox="0 0 260 260" className="overflow-visible">
                    {/* Grid rings */}
                    {[0.25, 0.5, 0.75, 1].map((scale) => (
                      <polygon
                        key={scale}
                        points={Array.from({ length: 5 }).map((_, i) => {
                          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                          const r = 100 * scale;
                          return `${130 + r * Math.cos(angle)},${130 + r * Math.sin(angle)}`;
                        }).join(" ")}
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth={scale === 1 ? "1.5" : "1"}
                        strokeDasharray={scale < 1 ? "3 3" : undefined}
                      />
                    ))}
                    {/* Axis lines */}
                    {["prompt_injection","jailbreak_resistance","task_hijacking","data_leakage","context_manipulation"].map((_, i) => {
                      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                      return (
                        <line key={i}
                          x1="130" y1="130"
                          x2={130 + 100 * Math.cos(angle)}
                          y2={130 + 100 * Math.sin(angle)}
                          stroke="#E2E8F0" strokeWidth="1"
                        />
                      );
                    })}
                    {/* Score polygon */}
                    <polygon
                      points={getRadarPoints()}
                      fill={`${overallColor}25`}
                      stroke={overallColor}
                      strokeWidth="2"
                    />
                    {/* Score dots */}
                    {getRadarPoints().split(" ").map((pt, i) => {
                      const [x, y] = pt.split(",");
                      const axes = ["prompt_injection","jailbreak_resistance","task_hijacking","data_leakage","context_manipulation"];
                      return (
                        <circle key={i} cx={x} cy={y} r="5"
                          fill={AXIS_COLORS[axes[i]]} stroke="#fff" strokeWidth="2"
                        />
                      );
                    })}
                  </svg>

                  {/* Axis labels */}
                  {[
                    { axis: "prompt_injection",     pos: "absolute top-0 left-1/2 -translate-x-1/2 text-center" },
                    { axis: "jailbreak_resistance",  pos: "absolute top-[22%] right-0 text-right" },
                    { axis: "task_hijacking",        pos: "absolute bottom-[8%] right-2 text-right" },
                    { axis: "data_leakage",          pos: "absolute bottom-[8%] left-2 text-left" },
                    { axis: "context_manipulation",  pos: "absolute top-[22%] left-0 text-left" },
                  ].map(({ axis, pos }) => (
                    <div key={axis} className={`${pos} font-mono text-[0.6rem] leading-tight`}>
                      <div className="text-[#475569]">{PROBE_LABELS[axis]}</div>
                      <div className="font-bold" style={{ color: AXIS_COLORS[axis] }}>
                        {getScore(axis)}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score legend */}
                <div className="w-full mt-4 pt-4 border-t border-[#E2E8F0] grid grid-cols-5 gap-1">
                  {Object.entries(PROBE_LABELS).map(([axis, label]) => (
                    <div key={axis} className="flex flex-col items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: AXIS_COLORS[axis] }} />
                      <div className="font-mono text-[0.55rem] text-[#64748B] text-center leading-tight">
                        {label.split(" ")[0]}
                      </div>
                      <div className="font-mono text-[0.62rem] font-bold text-black">{getScore(axis)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── RIGHT: Results ── */}
              <div className="space-y-5">

                {/* Groq Reasoning */}
                {audit.reasoning && (
                  <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-[#8B5CF6]" />
                      <span className="font-mono text-xs font-bold text-black uppercase">Groq Evaluator Reasoning</span>
                    </div>
                    <p className="text-sm font-sans text-[#475569] leading-relaxed italic">
                      "{audit.reasoning}"
                    </p>
                  </div>
                )}

                {/* Probe-by-probe results */}
                <div className="border border-[#E2E8F0] bg-white rounded-lg overflow-hidden shadow-xs">
                  <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-mono font-bold text-black uppercase">
                    ADVERSARIAL_PROBE_RESULTS // 5 LIVE ATTACKS
                  </div>
                  <div className="divide-y divide-[#E2E8F0]">
                    {(audit.probe_outputs || audit.vulnerabilities || []).map((po: any, idx: number) => {
                      const axis = po.axis || "";
                      const score = getScore(axis);
                      const passed = score >= 80;
                      return (
                        <div key={idx} className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {passed
                                ? <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                                : <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                              }
                              <div>
                                <div className="text-sm font-sans font-bold text-black">
                                  {po.test_name || po.test}
                                </div>
                                <div className="text-[0.65rem] font-mono text-[#64748B] uppercase mt-0.5">
                                  {PROBE_LABELS[axis] || axis}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className="font-mono text-xs font-bold px-2 py-0.5 rounded"
                                style={{
                                  color: passed ? "#10B981" : "#EF4444",
                                  background: passed ? "#F0FDF4" : "#FEF2F2",
                                  border: `1px solid ${passed ? "#DCFCE7" : "#FECACA"}`
                                }}
                              >
                                {score}% {passed ? "SAFE" : "RISK"}
                              </span>
                            </div>
                          </div>
                          {/* Probe text */}
                          {po.probe && (
                            <div className="ml-6 mb-1.5 p-2.5 bg-[#FFF7ED] border border-[#FED7AA] rounded text-xs font-mono text-[#92400E]">
                              <span className="font-bold">PROBE: </span>{po.probe}
                            </div>
                          )}
                          {/* Model response snippet */}
                          {po.response && (
                            <div className="ml-6 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-xs font-mono text-[#475569]">
                              <span className="font-bold text-black">RESPONSE: </span>
                              {po.response.slice(0, 220)}{po.response.length > 220 ? "..." : ""}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Executive summary */}
                {audit.audit_summary && (
                  <div className="border border-[#E2E8F0] bg-white rounded-lg p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <FileCheck2 className="w-4 h-4 text-[#0284C7]" />
                      <span className="font-mono text-xs font-bold text-black uppercase">Executive Summary</span>
                    </div>
                    <p className="text-sm font-sans text-[#475569] leading-relaxed">
                      {audit.audit_summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}