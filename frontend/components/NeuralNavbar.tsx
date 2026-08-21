"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function NeuralNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E4E4E7]">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand Logo ── */}
          <Link href="/" className="flex flex-col group">
            <span className="font-sans font-extrabold text-lg tracking-tight text-black">
              agentnet
            </span>
            <span className="font-mono text-[0.55rem] tracking-[0.2em] text-[#A1A1AA] uppercase -mt-0.5">
              UTILITY // DESIGN
            </span>
          </Link>

          {/* ── Center Nav Links ── */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="relative py-5 text-xs font-mono font-bold tracking-widest text-black uppercase"
            >
              MARKETPLACE
              {/* Active indicator line */}
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
            </Link>

            <Link
              href="/browse"
              className="text-xs font-mono font-medium tracking-widest text-[#71717A] hover:text-black transition-colors uppercase"
            >
              BROWSE
            </Link>

            <Link
              href="/create"
              className="text-xs font-mono font-medium tracking-widest text-[#71717A] hover:text-black transition-colors uppercase"
            >
              DEPLOY AGENT
            </Link>

            <Link
              href="/arena"
              className="text-xs font-mono font-medium tracking-widest text-[#71717A] hover:text-black transition-colors uppercase"
            >
              CONNECT
            </Link>
          </nav>

          {/* ── Right Action Button ── */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="border border-[#E4E4E7] hover:border-black px-4 py-2 text-xs font-mono font-semibold text-black tracking-widest uppercase transition-all bg-white hover:bg-[#FAFAFA]"
            >
              CONNECT_ID
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
        <div className="md:hidden border-t border-[#E4E4E7] bg-white px-6 py-4 space-y-3">
          <Link href="/" className="block text-xs font-mono font-bold uppercase tracking-widest text-black">MARKETPLACE</Link>
          <Link href="/browse" className="block text-xs font-mono uppercase tracking-widest text-[#71717A]">BROWSE</Link>
          <Link href="/create" className="block text-xs font-mono uppercase tracking-widest text-[#71717A]">DEPLOY AGENT</Link>
          <Link href="/arena" className="block text-xs font-mono uppercase tracking-widest text-[#71717A]">CONNECT</Link>
          <div className="pt-2">
            <Link href="/login" className="block text-center border border-black py-2 text-xs font-mono font-bold uppercase">CONNECT_ID</Link>
          </div>
        </div>
      )}
    </header>
  );
}