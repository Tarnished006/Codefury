"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Cpu, Terminal, Shield, Zap, GitCompare, Landmark, Code2, Wallet } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

export default function NeuralNavbar() {
  const [open, setOpen] = useState(false);
  const [p50, setP50] = useState(38);
  const pathname = usePathname();
  const { credits } = useAuthContext();

  useEffect(() => {
    const t = setInterval(() => setP50(34 + Math.floor(Math.random() * 8)), 3500);
    return () => clearInterval(t);
  }, []);

  const navLinks = [
    { href: "/", label: "MODELS" },
    { href: "/orchestrator", label: "ORCHESTRATOR", icon: Cpu },
    { href: "/arena", label: "ARENA", icon: GitCompare },
    { href: "/security", label: "SECURITY", icon: Shield, iconColor: "text-[#10B981]" },
    { href: "/creator", label: "CREATOR_STUDIO", icon: Landmark },
    { href: "/wallet", label: "WALLET", icon: Wallet },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand Logo: AgentHub ── */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-extrabold text-lg tracking-tight text-black flex items-center gap-0.5">
                Agent<span className="text-[#0284C7]">Hub</span>
              </span>
              <span className="font-mono text-[0.55rem] tracking-wider text-[#64748B] uppercase -mt-1 font-medium hidden sm:inline">
                Autonomous Model Network
              </span>
            </div>
          </Link>

          {/* ── Center Nav Links ── */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-5 text-xs font-mono tracking-widest uppercase transition-colors flex items-center gap-1.5 ${
                    isActive ? "text-black font-bold" : "text-[#64748B] hover:text-black font-medium"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${link.iconColor || ""}`} />}
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Telemetry & Deployments Action ── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live latency pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 border border-[#E2E8F0] bg-[#F8FAFC] rounded-md text-xs font-mono text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>P50:</span>
              <span className="font-bold text-black">{p50}ms</span>
            </div>

            {/* Wallet credit badge (Clickable to /wallet) */}
            <Link
              href="/wallet"
              className="px-2.5 py-1 bg-[#F1F5F9] border border-[#E2E8F0] hover:border-black rounded-md text-xs font-mono font-bold text-black transition-colors flex items-center gap-1.5"
            >
              <Wallet className="w-3 h-3 text-[#0284C7]" />
              <span>CR: {credits}</span>
            </Link>

            {/* Deployments / Sandbox Button */}
            <Link
              href="/deployments"
              className="btn-solid-black py-2 px-3.5 text-xs font-semibold gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Deployments</span>
            </Link>
          </div>

          {/* ── Mobile Menu Toggle ── */}
          <button
            className="lg:hidden p-2 text-black"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden border-t border-[#E2E8F0] bg-white px-5 py-4 space-y-3 shadow-md">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-xs font-mono uppercase tracking-widest py-1 ${
                pathname === link.href ? "font-bold text-black" : "text-[#64748B]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex items-center gap-2">
            <Link
              href="/deployments"
              onClick={() => setOpen(false)}
              className="w-full text-center btn-solid-black py-2 text-xs font-semibold"
            >
              Deployments Canvas
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}