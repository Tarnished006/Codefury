"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  Zap,
  Shield,
  Layers,
  ChevronDown,
  Minimize2,
  Maximize2
} from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";
import { getApiBaseUrl } from "@/lib/api";

interface SuggestedModel {
  id: string;
  name: string;
  domain: string;
  price_per_1k: number;
  p50_latency_ms: number;
  context_length: number;
  match_reason?: string;
}

interface ActionPill {
  label: string;
  href: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  suggested_models?: SuggestedModel[];
  suggested_actions?: ActionPill[];
  timestamp: string;
}

const STARTER_PROMPTS = [
  "Recommend the best model for Python code generation",
  "How does the 80/20 creator revenue split work?",
  "Which model has the highest OWASP security containment?",
  "What is the API Registry and how do I register endpoints?",
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your **AgentHub Intelligence Copilot**.\n\nI can recommend optimal models from our 51+ catalog, formulate multi-model DAG architectures, or guide you through deploying external endpoints via the API Registry.",
      suggested_actions: [
        { label: "Model Recommender", href: "/recommend" },
        { label: "Meta-Agent DAG", href: "/orchestrator" },
        { label: "Matchmaker Arena", href: "/arena" },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const pathname = usePathname();
  const { user, credits } = useAuthContext();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMsg = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${getApiBaseUrl()}/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          chat_history: historyPayload,
          current_page: pathname || "/",
          user_handle: user?.handle,
          user_credits: credits,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMsg = {
        role: "assistant",
        content: data.reply || "I evaluated your query against the catalog.",
        suggested_models: data.suggested_models || [],
        suggested_actions: data.suggested_actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I experienced a connection interruption with the gateway. You can also explore our models directly in the [Model Catalog](/) or test in the [Arena](/arena).",
          suggested_actions: [
            { label: "Model Catalog", href: "/" },
            { label: "Arena Benchmark", href: "/arena" },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating Launcher Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 bg-black text-white border border-black shadow-2xl hover:bg-[#FF4500] hover:border-[#FF4500] transition-all duration-300 transform hover:-translate-y-0.5"
            aria-label="Open AgentHub AI Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF4500] group-hover:bg-white animate-pulse" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider hidden sm:inline">
              Ask Copilot
            </span>
          </button>
        )}
      </div>

      {/* ── Chat Drawer Window ── */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white border border-black shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-300 ${
            isExpanded
              ? "w-[92vw] md:w-[650px] h-[85vh]"
              : "w-[92vw] md:w-[420px] h-[580px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-black text-white border-b border-black shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-mono font-bold text-xs">
                AH
              </div>
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span>agentnet Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
                </div>
                <div className="font-mono text-[9px] text-white/50 tracking-widest uppercase">
                  51+ Models · Groq + GPT-5-Mini Failover
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/[0.01]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-black/40">
                    {m.role === "user" ? `@${user?.handle || "You"}` : "AgentHub Copilot"}
                  </span>
                  <span className="font-mono text-[8px] text-black/30">· {m.timestamp}</span>
                </div>

                <div
                  className={`px-3.5 py-2.5 text-xs font-sans leading-relaxed max-w-[88%] border ${
                    m.role === "user"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black/90 border-black/15 shadow-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans text-xs">{m.content}</div>

                  {/* Render Suggested Models Card */}
                  {m.suggested_models && m.suggested_models.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
                      <div className="font-mono text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#FF4500]" />
                        <span>Recommended Models:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {m.suggested_models.map((mod) => (
                          <div
                            key={mod.id}
                            className="p-2 bg-black/[0.02] border border-black/10 flex items-center justify-between gap-2 text-[11px]"
                          >
                            <div className="truncate">
                              <div className="font-bold text-black truncate">{mod.name}</div>
                              <div className="font-mono text-[9px] text-black/50">
                                {mod.domain} · {mod.p50_latency_ms}ms · ${mod.price_per_1k}/1k
                              </div>
                            </div>
                            <Link
                              href={`/arena?model=${mod.id}`}
                              onClick={() => setIsOpen(false)}
                              className="px-2 py-1 bg-black text-white text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-[#FF4500] shrink-0"
                            >
                              Arena
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render Suggested Action Pills */}
                  {m.suggested_actions && m.suggested_actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-black/10 flex flex-wrap gap-1.5">
                      {m.suggested_actions.map((act, aIdx) => (
                        <Link
                          key={aIdx}
                          href={act.href}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/[0.04] hover:bg-black hover:text-white border border-black/15 font-mono text-[10px] font-bold uppercase tracking-wider text-black transition-colors"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-black/50 text-xs font-mono py-2">
                <div className="w-2 h-2 bg-[#FF4500] animate-ping rounded-full" />
                <span>Copilot reasoning over 51+ model catalog...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Starter Chips */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 py-2 border-t border-black/5 bg-black/[0.01] flex flex-wrap gap-1">
              {STARTER_PROMPTS.map((p, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSend(p)}
                  className="text-[10px] font-mono text-left px-2 py-1 bg-white border border-black/10 hover:border-black text-black/70 hover:text-black transition-colors truncate max-w-full"
                >
                  + {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-black/15 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about models, tasks, budget, or architecture..."
                className="flex-1 px-3 py-2 text-xs font-sans bg-black/[0.02] border border-black/20 focus:border-black focus:outline-none transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3.5 py-2 bg-black text-white hover:bg-[#FF4500] disabled:opacity-40 disabled:hover:bg-black font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
