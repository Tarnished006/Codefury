"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle,
  ChevronDown, Search, Cpu, Zap, FileCheck2,
  RefreshCw, CheckCircle2, XCircle, Loader2, Info,
  Terminal, Code2, Copy, Check
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

export default function SecurityPage() {
  const [models, setModels]             = useState<any[]>([]);
  const [domainFilter, setDomainFilter] = useState("ALL DOMAINS");
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [audit, setAudit]               = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [probeProgress, setProbeProgress] = useState<string[]>([]);
  const [activeTab, setActiveTab]       = useState<"probes" | "logs">("probes");
  const [copiedLog, setCopiedLog]       = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchModels().then((data: any[]) => {
      setModels(data || []);
      if (data?.length > 0) setSelectedModel(data[0]);
    }).catch(console.error);
  }, []);

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
      (m.domain || "").replace("_", " ").toUpperCase() === domainFilter;
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

    const probeNames = [
      "Dispatching Probe 1: Multi-Turn XML Delimiter Breakout & System Override...",
      "Dispatching Probe 2: Authorized Pentest Pretexting & Auth Token Bypass Script...",
      "Dispatching Probe 3: Steganographic Markdown Exfiltration Beacon Hijack...",
      "Dispatching Probe 4: Verbatim System Instruction Extraction via Completion Priming...",
      "Dispatching Probe 5: Virtualized Linux Shell & Database Privilege Escalation...",
      "Forwarding raw response transcripts to Groq LLM-as-a-Judge (openai/gpt-oss-120b)...",
      "Evaluating 5-axis OWASP containment scores & safety boundary reasoning...",
    ];
    let i = 0;
    const ticker = setInterval(() => {
      if (i < probeNames.length) {
        setProbeProgress(prev => [...prev, probeNames[i]]);
        i++;
      } else {
        clearInterval(ticker);
      }
    }, 750);

    try {
      const data = await fetchModelAudit(selectedModel.id);
      clearInterval(ticker);
      setAudit(data);
      setProbeProgress([]);
    } catch (e) {
      clearInterval(ticker);
      setProbeProgress(["Error connecting to security engine."]);
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

  const copyLogs = () => {
    if (!audit?.execution_logs) return;
    navigator.clipboard.writeText(audit.execution_logs.join("\n"));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const overallScore = audit?.overall_score ?? 0;
  const overallColor = overallScore >= 80 ? "#10B981" : overallScore >= 60 ? "#FF4500" : "#EF4444";

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-mono bg-black text-white font-bold">OWASP_LLM_TOP_10</span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">// LLM-as-a-Judge Red-Team Penetration Assessment</span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              security radar.
            </h1>
            <p className="text-xs text-black/60 mt-1 font-mono uppercase max-w-xl">
              Live adversarial attack evaluation via Groq openai/gpt-oss-120b judge across 5 production boundary conditions.
            </p>
          </div>
          {audit && (
            <div
              className="font-mono text-xs font-bold px-4 py-2 border uppercase tracking-wider"
              style={{ color: overallColor, borderColor: overallColor, background: `${overallColor}10` }}
            >
              {overallScore}% OVERALL CONTAINMENT
            </div>
          )}
        </div>

        {/* ── Model Selector Panel ── */}
        <div className="border border-black/10 bg-white p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <span className="font-mono text-[10px] font-bold text-black/50 uppercase tracking-widest shrink-0">
              TARGET_MODEL:
            </span>

            {/* Domain filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {DOMAINS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDomainFilter(d); setDropdownOpen(true); }}
                  className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                    domainFilter === d
                      ? "bg-black text-white"
                      : "bg-black/[0.02] text-black/50 border border-black/10 hover:text-black"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Searchable model dropdown */}
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between gap-3 border border-black/15 bg-black/[0.015] px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Shield className="w-4 h-4 text-[#FF4500] shrink-0" />
                  {selectedModel ? (
                    <div className="min-w-0">
                      <div className="text-xs font-sans font-bold text-black truncate">{selectedModel.name}</div>
                      <div className="text-[10px] font-mono text-black/50 truncate">{selectedModel.repo_id}</div>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-black/40">Select a model to audit...</span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-black/40 transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-black/15 shadow-2xl overflow-hidden">
                  <div className="p-2 border-b border-black/10">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-black/40 absolute left-2.5 top-2.5" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="SEARCH MODEL OR REPO..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-black/15 bg-black/[0.015] uppercase tracking-wider outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-black/5">
                    {filteredModels.length === 0 ? (
                      <div className="p-4 text-xs font-mono text-black/40 text-center">No models match filter</div>
                    ) : filteredModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setSelectedModel(m); setDropdownOpen(false); setAudit(null); }}
                        className={`w-full text-left px-4 py-3 hover:bg-black/[0.02] transition-colors flex items-center gap-3 ${
                          selectedModel?.id === m.id ? "bg-black/[0.04]" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-sans font-bold text-black">{m.name}</div>
                          <div className="text-[10px] font-mono text-black/50 truncate">{m.repo_id}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[9px] font-mono px-2 py-0.5 bg-black/[0.03] border border-black/10 uppercase">
                            {m.domain}
                          </span>
                          {selectedModel?.id === m.id && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4500]" />
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
              className="btn-solid-black px-8 py-3.5 shrink-0 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Red-Team Probes...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Run Live Audit</span>
                </>
              )}
            </button>
          </div>

          {selectedModel && (
            <div className="mt-5 pt-4 border-t border-black/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[9px] text-black/40 uppercase block">DOMAIN</span>
                <strong className="text-black uppercase">{selectedModel.domain}</strong>
              </div>
              <div>
                <span className="text-[9px] text-black/40 uppercase block">TASK</span>
                <strong className="text-black">{selectedModel.task_tag}</strong>
              </div>
              <div>
                <span className="text-[9px] text-black/40 uppercase block">CONTEXT</span>
                <strong className="text-black">{selectedModel.context_length?.toLocaleString() || "8,192"} tok</strong>
              </div>
              <div>
                <span className="text-[9px] text-black/40 uppercase block">REPO</span>
                <strong className="text-black truncate block">{selectedModel.repo_id}</strong>
              </div>
            </div>
          )}
        </div>

        {/* ── Probe Progress Log ── */}
        {loading && probeProgress.length > 0 && (
          <div className="border border-black/10 bg-black text-white p-6 mb-8 font-mono text-xs">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
              <span className="text-[#FF4500] font-bold tracking-widest uppercase">GROQ_RED_TEAM_ENGINE // FIRING LIVE ATTACK PROBES</span>
            </div>
            <div className="space-y-2">
              {probeProgress.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-white/70">
                  <span className="text-[#FF4500]">›</span>
                  <span>{msg}</span>
                  {i === probeProgress.length - 1 && (
                    <Loader2 className="w-3 h-3 animate-spin text-[#FF4500]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loading && !audit && (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-black/15 bg-black/[0.01] text-center">
            <Shield className="w-10 h-10 text-black/20 mb-4" />
            <p className="font-mono text-xs text-black/60 font-bold uppercase tracking-widest">SELECT A MODEL + CLICK "RUN LIVE AUDIT"</p>
            <p className="text-[10px] font-mono text-black/40 uppercase tracking-wider mt-1">
              5 realistic OWASP penetration attack vectors will be executed in real time by Groq openai/gpt-oss-120b.
            </p>
          </div>
        )}

        {/* ── Audit Results ── */}
        {audit && !loading && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 flex-wrap border-b border-black/10 pb-4">
              <span className="flex items-center gap-1.5 text-xs font-mono text-black/60">
                <Cpu className="w-3.5 h-3.5 text-[#FF4500]" />
                Evaluator: <strong className="text-black">{audit.evaluated_by || "Groq openai/gpt-oss-120b"}</strong>
              </span>
              <span className="text-black/20">|</span>
              <span className="text-xs font-mono text-black/60">
                Target Repo: <strong className="text-black">{audit.repo_id || selectedModel?.repo_id}</strong>
              </span>
              {audit.audit_duration_ms && (
                <>
                  <span className="text-black/20">|</span>
                  <span className="text-xs font-mono text-black/60">
                    Latency: <strong className="text-black">{audit.audit_duration_ms}ms</strong>
                  </span>
                </>
              )}

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(activeTab === "probes" ? "logs" : "probes")}
                  className="btn-outline py-1.5 px-3 text-[10px]"
                >
                  <Terminal className="w-3 h-3" />
                  {activeTab === "probes" ? "View Raw Execution Logs" : "View Probe Evaluations"}
                </button>
                <button onClick={runAudit} className="btn-solid-black py-1.5 px-3 text-[10px]">
                  <RefreshCw className="w-3 h-3" />
                  Re-Run Live Audit
                </button>
              </div>
            </div>

            {/* Tab 1: Standard Radar & Probes */}
            {activeTab === "probes" ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 items-start">

                {/* ── SVG Radar Chart ── */}
                <div className="border border-black/10 bg-white p-8 flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-6">
                    <span className="font-mono text-[10px] font-bold text-black uppercase tracking-widest">MULTI_AXIS_SECURITY_RADAR</span>
                    <span className="font-mono text-xs font-bold" style={{ color: overallColor }}>
                      {overallScore}% CONTAINMENT
                    </span>
                  </div>

                  <div className="relative w-[260px] h-[260px] flex items-center justify-center my-4">
                    <svg width="260" height="260" viewBox="0 0 260 260" className="overflow-visible">
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
                      <polygon
                        points={getRadarPoints()}
                        fill="rgba(255, 69, 0, 0.15)"
                        stroke="#FF4500"
                        strokeWidth="2"
                      />
                      {getRadarPoints().split(" ").map((pt, i) => {
                        const [x, y] = pt.split(",");
                        return (
                          <circle key={i} cx={x} cy={y} r="4"
                            fill="#FF4500" stroke="#fff" strokeWidth="2"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Score Breakdown Bar */}
                  <div className="w-full mt-6 pt-6 border-t border-black/10 grid grid-cols-5 gap-2">
                    {Object.entries(PROBE_LABELS).map(([axis, label]) => (
                      <div key={axis} className="flex flex-col items-center gap-1">
                        <div className="font-mono text-[9px] text-black/50 text-center uppercase tracking-wider">
                          {label.split(" ")[0]}
                        </div>
                        <div className="font-mono text-xs font-bold text-black">{getScore(axis)}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Probe Outputs & Reasoning ── */}
                <div className="space-y-6">

                  {/* Groq Reasoning Narrative */}
                  {audit.reasoning && (
                    <div className="border border-black/10 bg-black/[0.02] p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Cpu className="w-4 h-4 text-[#FF4500]" />
                        <span className="font-mono text-[10px] font-bold text-black uppercase tracking-widest">Groq LLM-as-a-Judge Security Assessment</span>
                      </div>
                      <p className="text-xs font-mono text-black/80 leading-relaxed uppercase">
                        "{audit.reasoning}"
                      </p>
                    </div>
                  )}

                  {/* Probe Cards */}
                  <div className="border border-black/10 bg-white overflow-hidden">
                    <div className="px-6 py-4 bg-black/[0.02] border-b border-black/10 text-[10px] font-mono font-bold text-black uppercase tracking-widest">
                      REAL_WORLD_ADVERSARIAL_PROBE_EVALUATIONS // 5 ATTACK VECTORS
                    </div>
                    <div className="divide-y divide-black/10">
                      {(audit.probe_outputs || audit.vulnerabilities || []).map((po: any, idx: number) => {
                        const axis = po.axis || "";
                        const score = getScore(axis);
                        const passed = score >= 70;
                        return (
                          <div key={idx} className="p-6">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                {passed
                                  ? <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                                  : <XCircle className="w-4 h-4 text-[#FF4500] shrink-0" />
                                }
                                <div>
                                  <div className="text-sm font-sans font-bold text-black">
                                    {po.test_name || po.test}
                                  </div>
                                  <div className="text-[10px] font-mono text-black/40 uppercase mt-0.5 tracking-wider">
                                    {po.attack_vector || PROBE_LABELS[axis] || axis}
                                  </div>
                                </div>
                              </div>
                              <span
                                className="font-mono text-[10px] font-bold px-2.5 py-1 uppercase"
                                style={{
                                  color: passed ? "#10B981" : "#FF4500",
                                  background: passed ? "#F0FDF4" : "#FFF7ED",
                                  border: `1px solid ${passed ? "#DCFCE7" : "#FFEDD5"}`
                                }}
                              >
                                {score}% {passed ? "MITIGATED" : "VULNERABLE"}
                              </span>
                            </div>

                            {po.probe && (
                              <div className="ml-7 mb-3 p-3 bg-black/[0.02] border border-black/10 text-xs font-mono text-black/80 whitespace-pre-wrap">
                                <span className="font-bold text-[#FF4500]">ADVERSARIAL ATTACK PAYLOAD: </span>
                                {po.probe}
                              </div>
                            )}

                            {po.response && (
                              <div className="ml-7 p-3 bg-white border border-black/10 text-xs font-mono text-black/70 whitespace-pre-wrap">
                                <span className="font-bold text-black">TARGET MODEL OUTPUT: </span>
                                {po.response}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Raw Terminal Execution Logs */
              <div className="border border-black/10 bg-black text-white p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#FF4500]" />
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                      RAW_AUDIT_EXECUTION_LOGS // GROQ_OPENAI_GPT_OSS_120B
                    </span>
                  </div>
                  <button
                    onClick={copyLogs}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-mono text-white transition-colors"
                  >
                    {copiedLog ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLog ? "Copied" : "Copy Logs"}</span>
                  </button>
                </div>

                <div className="space-y-1.5 font-mono text-xs max-h-[600px] overflow-y-auto">
                  {audit.execution_logs && audit.execution_logs.length > 0 ? (
                    audit.execution_logs.map((line: string, idx: number) => (
                      <div key={idx} className="text-white/80 leading-relaxed font-mono">
                        <span className="text-[#FF4500]">›</span> {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-white/40">No raw logs captured.</div>
                  )}
                </div>

                {audit.raw_judge_output && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <span className="font-mono text-[10px] text-[#FF4500] uppercase tracking-widest font-bold block mb-2">
                      RAW_LLM_AS_A_JUDGE_JSON_RESPONSE:
                    </span>
                    <pre className="p-4 bg-white/5 border border-white/10 text-xs font-mono text-white/90 overflow-x-auto whitespace-pre-wrap">
                      {audit.raw_judge_output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}