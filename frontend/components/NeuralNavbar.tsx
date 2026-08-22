"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Cpu,
  Shield,
  Zap,
  GitCompare,
  Landmark,
  Code2,
  Wallet,
  User,
  LogOut,
  ArrowRight
} from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

export default function NeuralNavbar() {
  const [open, setOpen] = useState(false);
  const [p50, setP50] = useState(38);
  const pathname = usePathname();
  const { user, credits, logout, isAuthenticated } = useAuthContext();

  useEffect(() => {
    const t = setInterval(() => setP50(32 + Math.floor(Math.random() * 6)), 4000);
    return () => clearInterval(t);
  }, []);

  const navLinks = [
    { href: "/", label: "MARKETPLACE" },
    { href: "/recommend", label: "RECOMMENDER" },
    { href: "/orchestrator", label: "ORCHESTRATOR" },
    { href: "/arena", label: "ARENA" },
    { href: "/security", label: "SECURITY_RADAR" },
    { href: "/creator", label: "CREATOR_STUDIO" },
    { href: "/wallet", label: "WALLET" },
    { href: "/profile", label: "PROFILE" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/10 px-6 py-3.5 transition-all">
      <div className="mx-auto max-w-[1600px] flex items-center justify-between">

        {/* ── Brand Logo: agentnet / agenthub ── */}
        <Link href="/" className="flex flex-col group shrink-0">
          <span className="font-sans font-extrabold text-2xl tracking-tighter text-black leading-none transition-colors duration-500 group-hover:text-[#FF4500]">
            agentnet
          </span>
          <span className="font-mono text-[7px] text-black/30 uppercase tracking-[0.45em] mt-0.5 font-semibold">
            Reality // Mesh
          </span>
        </Link>

        {/* ── Center Nav Links ── */}
        <nav className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[11px] font-mono font-bold uppercase tracking-widest transition-colors duration-300 py-1 ${
                  isActive ? "text-black" : "text-black/40 hover:text-black"
                }`}
              >
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-3 left-0 right-0 h-[2px] bg-black" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Telemetry, Wallet & User Auth Badge ── */}
        <div className="hidden md:flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 border border-black/10 bg-black/[0.02] text-[10px] font-mono text-black/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] animate-pulse" />
            <span className="tracking-widest uppercase">LATENCY:</span>
            <span className="font-bold text-black">{p50}ms</span>
          </div>

          <Link
            href="/wallet"
            className="px-3 py-1.5 bg-black/[0.03] border border-black/15 hover:border-black text-[10px] font-mono font-bold text-black transition-all flex items-center gap-1.5 uppercase tracking-wider"
          >
            <Wallet className="w-3 h-3 text-[#FF4500]" />
            <span>CR: {credits}</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-black/10">
              {user.role === "creator" && (
                <span className="px-2 py-0.5 bg-[#FF4500]/10 border border-[#FF4500]/25 text-[#FF4500] text-[9px] font-mono font-extrabold uppercase tracking-wider select-none shrink-0">
                  CREATOR
                </span>
              )}
              <Link
                href="/profile"
                className="px-3 py-1.5 bg-black/[0.02] border border-black/10 text-[10px] font-mono text-black flex items-center gap-1.5 hover:border-black transition-colors"
              >
                <User className="w-3 h-3 text-black/50" />
                <span className="font-bold truncate max-w-[110px]">
                  @{user.handle || user.email.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 border border-black/15 hover:border-black bg-white text-black/60 hover:text-black transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1 border-l border-black/10">
              <Link
                href="/login"
                className="px-4 py-1.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#FF4500] transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          <Link
            href="/deployments"
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 border border-black hover:bg-[#FF4500] hover:border-[#FF4500] text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 group"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Deploy</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 text-black"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-black" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-black/10 bg-white px-6 py-5 space-y-4 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-[11px] font-mono uppercase tracking-widest py-1 ${
                pathname === link.href ? "font-bold text-black" : "text-black/50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-black/10 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-widest"
            >
              {user ? `Signed in as @${user.handle}` : "Sign In / Register"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}