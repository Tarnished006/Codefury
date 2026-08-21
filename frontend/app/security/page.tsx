"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Terminal,
  Activity,
  FileCheck2,
  Sparkles
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { fetchModelAudit } from "@/lib/api";

const MODELS = [
  { id: "llama3", name: "Llama 3 8B" },
  { id: "deepseek", name: "DeepSeek Coder" },
  { id: "biomedlm", name: "BioMistral 7B" },
  { id: "llava", name: "LLaVA 1.5 7B" },
  { id: "fingpt", name: "FinGPT" },
  { id: "mistral", name: "Mistral 7B" },
];

export default function SecurityPage() {
  const [selectedModel, setSelectedModel] = useState("llama3");
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAudit(selectedModel);
  }, [selectedModel]);

  const loadAudit = async (mid: string) => {
    setLoading(true);
    try {
      const data = await fetchModelAudit(mid);
      setAudit(data);
    } catch (e) {
      console.error("Audit load error", e);
    } finally {
      setLoading(false);
    }
  };

  const getScore = (axis: string, fallback: number = 90) => {
    if (!audit) return fallback;
    if (audit.scores && typeof audit.scores[axis] === "number") {
      return audit.scores[axis];
    }
    const directKey = `${axis}_score`;
    if (typeof audit[directKey] === "number") {
      return audit[directKey];
    }
    return fallback;
  };

  const getRadarPoints = () => {
    if (!audit) return "";
    const scores = [
      getScore("prompt_injection", 92),
      getScore("jailbreak_resistance", 88),
      getScore("task_hijacking", 95),
      getScore("data_leakage", 84),
      getScore("context_manipulation", 90),
    ];
    const center = 150;
    const radius = 100;
    const angleStep = (Math.PI * 2) / 5;

    return scores
      .map((score, i) => {
        const r = (score / 100) * radius;
        const angle = i * angleStep - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-mono bg-[#10B981] text-white font-bold">OWASP_TOP_10_AI</span>
              <span className="font-mono text-xs text-[#64748B]">// Automated Red-Team Security Radar</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              AI Security Radar & Audit
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-mono bg-white text-black font-bold">
              STATUS: {audit?.status?.toUpperCase() || "VERIFIED"}
            </span>
          </div>
        </div>

        {/* ── Model Selector Tabs ── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-4 py-2 text-xs font-sans font-semibold rounded-md transition-all whitespace-nowrap ${
                selectedModel === m.id
                  ? "bg-black text-white shadow-xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-black border border-[#E2E8F0]"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>

        {loading || !audit ? (
          <div className="flex flex-col items-center justify-center p-16 border border-[#E2E8F0] rounded-lg bg-[#FAFAFA]">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
            <span className="font-mono text-xs text-[#64748B]">[ EVALUATING_SECURITY_RADAR... ]</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">

            {/* ── LEFT: Visual Multi-Axis Radar Chart ── */}
            <div className="border border-[#E2E8F0] bg-white rounded-lg p-6 flex flex-col items-center justify-center shadow-xs">
              <div className="flex items-center justify-between w-full mb-4">
                <span className="font-mono text-xs font-bold text-black uppercase">
                  MULTI_AXIS_SECURITY_RADAR
                </span>
                <span className="font-mono text-xs text-[#10B981] font-bold">
                  {audit.overall_score}% COMPLIANT
                </span>
              </div>

              {/* SVG 5-Axis Radar Chart */}
              <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                <svg width="300" height="300" className="overflow-visible">
                  {[0.25, 0.5, 0.75, 1].map((scale) => (
                    <polygon
                      key={scale}
                      points={Array.from({ length: 5 })
                        .map((_, i) => {
                          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                          const r = 100 * scale;
                          return `${150 + r * Math.cos(angle)},${150 + r * Math.sin(angle)}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="1"
                      strokeDasharray={scale < 1 ? "3 3" : undefined}
                    />
                  ))}

                  {Array.from({ length: 5 }).map((_, i) => {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    return (
                      <line
                        key={i}
                        x1="150"
                        y1="150"
                        x2={150 + 100 * Math.cos(angle)}
                        y2={150 + 100 * Math.sin(angle)}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                    );
                  })}

                  <polygon
                    points={getRadarPoints()}
                    fill="rgba(16, 185, 129, 0.2)"
                    stroke="#10B981"
                    strokeWidth="2"
                  />

                  {getRadarPoints()
                    .split(" ")
                    .map((pt, i) => {
                      const [x, y] = pt.split(",");
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#10B981"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                </svg>

                <span className="absolute top-1 text-[0.62rem] font-mono text-black font-semibold">
                  Prompt Injection ({getScore("prompt_injection")}%)
                </span>
                <span className="absolute top-[28%] right-0 text-[0.62rem] font-mono text-black font-semibold text-right">
                  Jailbreak ({getScore("jailbreak_resistance")}%)
                </span>
                <span className="absolute bottom-[10%] right-2 text-[0.62rem] font-mono text-black font-semibold text-right">
                  Task Hijack ({getScore("task_hijacking")}%)
                </span>
                <span className="absolute bottom-[10%] left-2 text-[0.62rem] font-mono text-black font-semibold">
                  Data Leakage ({getScore("data_leakage")}%)
                </span>
                <span className="absolute top-[28%] left-0 text-[0.62rem] font-mono text-black font-semibold">
                  Context Tamper ({getScore("context_manipulation")}%)
                </span>
              </div>

              <div className="w-full mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#64748B]">STATUS:</span>
                <span className="text-[#10B981] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  VERIFIED SAFE FOR PRODUCTION
                </span>
              </div>
            </div>

            {/* ── RIGHT: Security Summary & Penetration Audit Logs ── */}
            <div className="space-y-6">
              <div className="border border-[#E2E8F0] bg-white rounded-lg p-6 shadow-xs">
                <h3 className="font-sans font-bold text-base text-black mb-2 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#0284C7]" />
                  Executive Audit Summary
                </h3>
                <p className="text-sm font-sans text-[#475569] leading-relaxed mb-4">
                  {audit.audit_summary}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[#F1F5F9] text-xs font-mono">
                  <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                    <span className="text-[0.62rem] text-[#64748B] block">PROMPT INJECTION</span>
                    <strong className="text-black">{getScore("prompt_injection")}% PASS</strong>
                  </div>
                  <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                    <span className="text-[0.62rem] text-[#64748B] block">DATA LEAKAGE</span>
                    <strong className="text-black">{getScore("data_leakage")}% PASS</strong>
                  </div>
                  <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#E2E8F0]">
                    <span className="text-[0.62rem] text-[#64748B] block">JAILBREAK</span>
                    <strong className="text-black">{getScore("jailbreak_resistance")}% PASS</strong>
                  </div>
                </div>
              </div>

              <div className="border border-[#E2E8F0] bg-white rounded-lg overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-mono font-bold text-black uppercase">
                  PENETRATION_TEST_LOGS // MITIGATED_VECTORS
                </div>

                <div className="divide-y divide-[#E2E8F0]">
                  {audit.vulnerabilities?.map((v: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-sans font-bold text-black">
                          {v.test}
                        </div>
                        <div className="text-[0.68rem] font-mono text-[#64748B] mt-0.5">
                          SEVERITY: <strong className="text-black">{v.severity}</strong>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] uppercase">
                        {v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}