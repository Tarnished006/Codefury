"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  History,
  Loader2
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";

const PACKAGES = [
  { credits: 500, price: 5, label: "STARTER TIER", desc: "500 GPU inference credits" },
  { credits: 1200, price: 10, label: "PRO DEVELOPER TIER", desc: "1,200 Credits (+20% bonus)", highlight: true },
  { credits: 3500, price: 25, label: "ENTERPRISE SCALE TIER", desc: "3,500 Credits (+40% bonus)" },
];

function WalletContent() {
  const { user, credits, setCredits } = useAuthContext();
  const searchParams = useSearchParams();
  const [selectedPkg, setSelectedPkg] = useState(1200);
  const [loading, setLoading] = useState(false);
  const [ledger, setLedger] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const userId = user?.id || "usr_guest_demo";

  useEffect(() => {
    loadLedger();
    checkSessionReturn();
  }, [userId]);

  const loadLedger = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/wallet/ledger/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (e) {
      console.error("Ledger load error", e);
    }
  };

  const checkSessionReturn = async () => {
    const status = searchParams.get("status");
    const sessionId = searchParams.get("session_id");

    if (status === "success" && sessionId) {
      try {
        const res = await fetch("http://localhost:8000/api/wallet/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId, user_id: userId }),
        });
        if (res.ok) {
          const data = await res.json();
          setSuccessMsg(`PAYMENT VERIFIED! +${data.credits_added} CREDITS SUCCESSFULLY PROVISIONED.`);
          setCredits(data.new_balance_credits);
          loadLedger();
        }
      } catch (e) {
        console.error("Verification error", e);
      }
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/wallet/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          credits_package: selectedPkg,
          payment_method: "stripe",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        }
      }
    } catch (e) {
      console.error("Checkout error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-mono bg-black text-white font-bold">METERED_BILLING</span>
            <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">// Stripe Checkout & Real-Time Settlement</span>
          </div>
          <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
            developer wallet.
          </h1>
        </div>

        <div className="border border-black/10 bg-black/[0.02] px-5 py-3 text-xs font-mono">
          CURRENT_BALANCE: <strong className="text-[#FF4500] text-sm ml-1">{credits} CR</strong>
        </div>
      </div>

      {/* ── Success Alert ── */}
      {successMsg && (
        <div className="mb-8 p-4 bg-[#F0FDF4] border border-[#DCFCE7] flex items-center gap-3 text-xs font-mono text-[#166534]">
          <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Package Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PACKAGES.map((pkg) => {
          const isSelected = selectedPkg === pkg.credits;
          return (
            <div
              key={pkg.credits}
              onClick={() => setSelectedPkg(pkg.credits)}
              className={`cursor-pointer border p-8 transition-all flex flex-col justify-between relative ${
                isSelected
                  ? "border-[#FF4500] bg-white ring-1 ring-[#FF4500]"
                  : "border-black/10 bg-white hover:border-black/30"
              }`}
            >
              {pkg.highlight && (
                <span className="absolute -top-3 right-6 bg-[#FF4500] text-white text-[9px] font-mono font-bold px-2.5 py-0.5 uppercase tracking-wider">
                  MOST POPULAR
                </span>
              )}

              <div>
                <span className="font-mono text-[10px] font-bold text-black/40 uppercase tracking-widest block mb-1">
                  {pkg.label}
                </span>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="font-sans font-extrabold text-4xl text-black">${pkg.price}</span>
                  <span className="font-mono text-xs text-black/50 uppercase tracking-wider">USD</span>
                </div>
                <p className="text-black/60 text-xs font-mono mb-6 uppercase">
                  {pkg.desc}
                </p>
              </div>

              <div className="pt-6 border-t border-black/10 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-black">
                  {pkg.credits.toLocaleString()} Credits
                </span>
                <span className={`w-4 h-4 border flex items-center justify-center ${isSelected ? "border-[#FF4500] bg-[#FF4500]" : "border-black/20"}`}>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Checkout Button ── */}
      <div className="border border-black/10 bg-black/[0.015] p-8 mb-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-sans font-bold text-lg text-black mb-1">
            Instant Credit Top-Up
          </h3>
          <p className="text-xs font-mono text-black/50 uppercase tracking-wider">
            Secured by Stripe · Instant zero-delay balance update on successful checkout
          </p>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-solid-black px-10 py-4 gap-2 shrink-0 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirecting to Stripe...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Purchase {selectedPkg} Credits</span>
            </>
          )}
        </button>
      </div>

      {/* ── Ledger Transactions ── */}
      <div className="border border-black/10 bg-white overflow-hidden">
        <div className="px-6 py-4 bg-black/[0.02] border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-black" />
            <span className="font-mono text-xs font-bold text-black uppercase tracking-widest">
              TRANSACTION_AUDIT_LEDGER
            </span>
          </div>
          <span className="font-mono text-[10px] text-black/40 uppercase">
            {ledger.length} ENTRIES
          </span>
        </div>

        <div className="divide-y divide-black/10 max-h-80 overflow-y-auto">
          {ledger.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-black/40 uppercase">
              No transactions recorded yet.
            </div>
          ) : (
            ledger.map((item) => (
              <div key={item.id} className="p-4 px-6 flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-black uppercase">{item.description}</div>
                  <div className="text-[10px] text-black/40 mt-0.5 uppercase">{item.created_at}</div>
                </div>
                <span className={`font-bold ${item.amount_credits > 0 ? "text-[#10B981]" : "text-black"}`}>
                  {item.amount_credits > 0 ? `+${item.amount_credits}` : item.amount_credits} CR
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-black" />
        </div>
      }>
        <WalletContent />
      </Suspense>
    </div>
  );
}