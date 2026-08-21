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
  History
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";

const PACKAGES = [
  { credits: 500, price: 5, label: "Starter Tier", desc: "500 GPU inference credits" },
  { credits: 1200, price: 10, label: "Pro Developer Tier", desc: "1,200 Credits (+20% bonus)", highlight: true },
  { credits: 3500, price: 25, label: "Enterprise Scale Tier", desc: "3,500 Credits (+40% bonus)" },
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
          setSuccessMsg(`Payment Verified! +${data.credits_added} Credits successfully added.`);
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
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge-mono bg-black text-white font-bold">METERED_BILLING</span>
            <span className="font-mono text-xs text-[#64748B]">// Stripe Checkout & Real-Time Fulfillment</span>
          </div>
          <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
            Developer Wallet & Credits
          </h1>
        </div>

        <div className="border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 rounded-lg text-xs font-mono">
          CURRENT_BALANCE: <strong className="text-black text-sm">{credits} CR</strong>
        </div>
      </div>

      {/* ── Success Alert ── */}
      {successMsg && (
        <div className="mb-8 p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg flex items-center gap-3 text-xs font-mono text-[#166534]">
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
              className={`cursor-pointer border rounded-xl p-6 transition-all flex flex-col justify-between relative ${
                isSelected
                  ? "border-black bg-white shadow-md ring-1 ring-black"
                  : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
              }`}
            >
              {pkg.highlight && (
                <span className="absolute -top-3 right-6 bg-black text-white text-[0.62rem] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                  Most Popular
                </span>
              )}

              <div>
                <span className="font-mono text-xs text-[#64748B] uppercase block mb-1">
                  {pkg.label}
                </span>
                <div className="font-sans font-black text-3xl text-black mb-1">
                  ${pkg.price} <span className="text-xs font-normal text-[#64748B]">USD</span>
                </div>
                <p className="text-xs font-sans text-[#475569] mb-6">
                  {pkg.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] text-xs font-mono">
                <span className="text-black font-bold">+{pkg.credits} Credits</span>
                <span className="text-[#0284C7] font-semibold">{isSelected ? "SELECTED" : "SELECT"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Stripe Checkout Trigger ── */}
      <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-6 mb-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-sans font-bold text-base text-black mb-1">
            Provision Credits via Stripe Test Checkout
          </h3>
          <p className="text-xs font-sans text-[#64748B]">
            Instant settlement powered by Stripe Checkout. Real-time webhook fulfillment directly into your wallet.
          </p>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="btn-solid-black px-6 py-3 text-xs font-semibold gap-2 shrink-0 self-stretch sm:self-auto"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Redirecting to Stripe...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Pay with Stripe (${(selectedPkg === 500 ? 5 : selectedPkg === 1200 ? 10 : 25)}.00)</span>
            </>
          )}
        </button>
      </div>

      {/* ── Double-Entry Ledger History ── */}
      <div className="border border-[#E2E8F0] bg-white rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-black" />
            <span className="font-mono text-xs font-bold text-black uppercase">
              DOUBLE_ENTRY_LEDGER // TRANSACTION_AUDIT_TRAIL
            </span>
          </div>
          <span className="text-xs font-mono text-[#64748B]">
            IMMUTABLE_LOG
          </span>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {ledger.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#64748B]">
              No transactions recorded yet. Run model inferences or top-up credits to see live double-entry records.
            </div>
          ) : (
            ledger.map((tx: any) => (
              <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <div className="font-bold text-black flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[0.68rem]">
                      {tx.transaction_type}
                    </span>
                    <span>{tx.description}</span>
                  </div>
                  <div className="text-[#94A3B8] text-[0.65rem] mt-0.5">
                    TX_ID: {tx.id} • {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-bold ${tx.transaction_type === "WALLET_TOPUP" ? "text-[#16A34A]" : "text-black"}`}>
                    {tx.transaction_type === "WALLET_TOPUP" ? "+" : "-"}{tx.cost_credits} CR
                  </span>
                  {tx.creator_royalty_credits > 0 && (
                    <div className="text-[0.62rem] text-[#0284C7]">
                      (80% Creator: +{tx.creator_royalty_credits} CR)
                    </div>
                  )}
                </div>
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
        <div className="max-w-[1440px] mx-auto px-6 pt-28 text-xs font-mono text-[#64748B]">
          [ LOADING_WALLET... ]
        </div>
      }>
        <WalletContent />
      </Suspense>
    </div>
  );
}