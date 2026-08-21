"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Cpu, Terminal, Shield, Zap } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

export default function NeuralNavbar() {
  const [open, setOpen] = useState(false);
  const [p50, setP50] = useState(38);
  const { credits } = useAuthContext();

  useEffect(() => {
    const t = setInterval(() => setP50(34 + Math.floor(Math.random() * 8)), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand Logo: AgentHub ── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-lg tracking-tight text-black flex items-center gap-0.5">
                Agent<span className="text-[#0284C7]">Hub</span>
              </span>
              <span className="font-mono text-[0.58rem] tracking-wider text-[#64748B] uppercase -mt-1 font-medium">
                Autonomous Model Network
              </span>
            </div>
          </Link>

          {/* ── Center Nav Links ── */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="relative py-5 text-xs font-mono font-bold tracking-widest text-black uppercase"
            >
              MODELS
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
            </Link>

            <Link
              href="/browse"
              className="text-xs font-mono font-medium tracking-widest text-[#64748B] hover:text-black transition-colors uppercase flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              ORCHESTRATOR
            </Link>

            <Link
              href="/browse"
              className="text-xs font-mono font-medium tracking-widest text-[#64748B] hover:text-black transition-colors uppercase"
            >
              ARENA
            </Link>

            <Link
              href="/browse"
              className="text-xs font-mono font-medium tracking-widest text-[#64748B] hover:text-black transition-colors uppercase flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#10B981]" />
              SECURITY
            </Link>
          </nav>

          {/* ── Right Telemetry & Action ── */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Live latency pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-md text-xs font-mono text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>P50:</span>
              <span className="font-bold text-black">{p50}ms</span>
            </div>

            {/* Wallet credit badge */}
            <div className="px-2.5 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-xs font-mono font-bold text-black">
              CR: {credits}
            </div>

            {/* Action button */}
            <Link
              href="/login"
              className="btn-solid-black py-2 px-4 text-xs font-semibold gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Developer Console</span>
            </Link>
          </div>

          {/* ── Mobile Menu Toggle ── */}
          <button
            className="md:hidden p-2 text-black"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-6 py-4 space-y-3">
          <Link href="/" className="block text-xs font-mono font-bold uppercase tracking-widest text-black">MODELS</Link>
          <Link href="/browse" className="block text-xs font-mono uppercase tracking-widest text-[#64748B]">ORCHESTRATOR</Link>
          <Link href="/browse" className="block text-xs font-mono uppercase tracking-widest text-[#64748B]">ARENA</Link>
          <Link href="/browse" className="block text-xs font-mono uppercase tracking-widest text-[#64748B]">SECURITY</Link>
          <div className="pt-2">
            <Link href="/login" className="block text-center btn-solid-black py-2 text-xs font-semibold">Developer Console</Link>
          </div>
        </div>
      )}
    </header>
  );
}