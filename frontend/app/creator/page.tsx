"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  Zap,
  X,
  Loader2
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { fetchCreators, fetchCreatorEarnings, requestCreatorPayout } from "@/lib/api";

export default function CreatorPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState("creator_meta");
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(200);
  const [payoutMethod, setPayoutMethod] = useState("stripe_connect");
  const [destAddress, setDestAddress] = useState("acct_1NZ4567890_us_bank");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutReceipt, setPayoutReceipt] = useState<any>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (selectedCreatorId) {
      loadEarnings(selectedCreatorId);
    }
  }, [selectedCreatorId]);

  const loadCreators = async () => {
    try {
      const data = await fetchCreators();
      setCreators(data);
      if (data.length > 0) setSelectedCreatorId(data[0].id);
    } catch (e) {
      console.error("Creators load error", e);
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async (cid: string) => {
    try {
      const data = await fetchCreatorEarnings(cid);
      setEarnings(data);
    } catch (e) {
      console.error("Earnings load error", e);
    }
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const receipt = await requestCreatorPayout({
        creator_id: selectedCreatorId,
        amount_credits: Number(payoutAmount),
        payout_method: payoutMethod,
        destination_address: destAddress,
      });
      setPayoutReceipt(receipt);
      loadEarnings(selectedCreatorId);
    } catch (err: any) {
      setPayoutError(err.message || "Payout failed");
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-mono bg-black text-white font-bold">DUAL_SIDED_MARKETPLACE</span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">// Creator Studio & 80/20 Royalties</span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              creator studio.
            </h1>
          </div>

          {/* Revenue Split Badge */}
          <div className="flex items-center gap-3 border border-black/10 bg-black/[0.02] px-4 py-2 text-xs font-mono">
            <span className="text-[#10B981] font-bold">80% CREATOR ROYALTY</span>
            <span className="text-black/20">/</span>
            <span className="text-black/60 font-semibold">20% PLATFORM TREASURY</span>
          </div>
        </div>

        {/* ── Creator Switcher Tabs ── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
          {creators.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCreatorId(c.id)}
              className={`px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2.5 ${
                selectedCreatorId === c.id
                  ? "bg-black text-white"
                  : "bg-black/[0.02] text-black/50 hover:text-black border border-black/10"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black/10 text-current">
                {c.models_count} Models
              </span>
            </button>
          ))}
        </div>

        {/* ── Earnings Metric Cards ── */}
        {earnings && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="border border-black/10 bg-white p-8">
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest block mb-2">
                AVAILABLE_FOR_PAYOUT
              </span>
              <div className="font-sans font-extrabold text-4xl text-black mb-1">
                {earnings.pending_payout_credits.toFixed(2)} <span className="text-sm font-mono text-black/50">Credits</span>
              </div>
              <div className="text-xs font-mono text-[#10B981] font-bold">
                ≈ ${earnings.pending_payout_usd.toFixed(2)} USD
              </div>
            </div>

            <div className="border border-black/10 bg-white p-8">
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest block mb-2">
                LIFETIME_ROYALTY_EARNINGS
              </span>
              <div className="font-sans font-extrabold text-4xl text-black mb-1">
                {earnings.lifetime_earnings_credits.toFixed(2)} <span className="text-sm font-mono text-black/50">Credits</span>
              </div>
              <div className="text-xs font-mono text-[#FF4500] font-bold">
                ≈ ${earnings.lifetime_earnings_usd.toFixed(2)} USD
              </div>
            </div>

            <div className="border border-black/10 bg-black/[0.015] p-8 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest block mb-2">
                  SETTLEMENT_GATEWAY
                </span>
                <div className="text-xs font-mono text-black/70 mb-4 uppercase">
                  Automatic Automated Clearing House (ACH) & Stripe Connect Payouts
                </div>
              </div>
              <button
                onClick={() => { setShowPayoutModal(true); setPayoutReceipt(null); }}
                className="btn-solid-black w-full py-3.5"
              >
                <span>Request Payout</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Creator Models Registry ── */}
        {earnings?.models && (
          <div className="border border-black/10 bg-white overflow-hidden">
            <div className="px-6 py-4 bg-black/[0.02] border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FF4500]" />
                <span className="font-mono text-xs font-bold text-black uppercase tracking-widest">
                  PORTFOLIO_MODELS ({earnings.models.length})
                </span>
              </div>
              <span className="font-mono text-[10px] text-black/40 uppercase">
                AUTOMATIC 80% REVENUE MESH
              </span>
            </div>

            <div className="divide-y divide-black/10">
              {earnings.models.map((m: any) => (
                <div key={m.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.015] transition-colors">
                  <div>
                    <div className="font-sans font-bold text-base text-black flex items-center gap-2">
                      {m.name}
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    </div>
                    <div className="font-mono text-xs text-black/50 mt-0.5">
                      {m.repo_id} · <span className="uppercase text-black/70">{m.task_tag}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-black/40 uppercase block">PRICE</span>
                      <strong className="text-black">${m.price_per_1k.toFixed(2)}/1k</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-black/40 uppercase block">SAFETY</span>
                      <strong className="text-[#10B981]">{m.security_score}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-black/40 uppercase block">ROYALTY</span>
                      <strong className="text-[#FF4500] font-bold">${(m.price_per_1k * 0.8).toFixed(3)}/1k</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Payout Request Modal ── */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-black/20 w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-6 right-6 text-black/40 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-sans font-extrabold text-2xl text-black mb-1">
              Initiate Creator Payout
            </h2>
            <p className="text-xs font-mono text-black/50 uppercase mb-6 tracking-wider">
              80% Royalty Revenue Withdrawal
            </p>

            {payoutReceipt ? (
              <div className="p-6 bg-[#F0FDF4] border border-[#DCFCE7] text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-[#16A34A] font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  PAYOUT DISPATCHED
                </div>
                <div>TRANSFER ID: <strong className="text-black">{payoutReceipt.transfer_id}</strong></div>
                <div>AMOUNT CREDITED: <strong className="text-black">${payoutReceipt.amount_usd.toFixed(2)} USD</strong></div>
                <div>SETTLEMENT METHOD: <strong className="text-black uppercase">{payoutReceipt.payout_method}</strong></div>
              </div>
            ) : (
              <form onSubmit={handleExecutePayout} className="space-y-4">
                {payoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs font-mono text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1">
                    WITHDRAWAL_CREDITS
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={earnings?.pending_payout_credits || 1000}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black"
                  />
                  <span className="text-[10px] font-mono text-black/40 mt-1 block">
                    ≈ ${(payoutAmount * 0.01).toFixed(2)} USD
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1">
                    PAYOUT_METHOD
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black uppercase"
                  >
                    <option value="stripe_connect">STRIPE CONNECT (ACH / DIRECT DEPOSIT)</option>
                    <option value="crypto_usdc">USDC BASE SEPOLIA WALLET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1">
                    DESTINATION_ACCOUNT
                  </label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="w-full border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="btn-outline flex-1 py-3 text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="btn-solid-black flex-1 py-3 text-[10px] disabled:opacity-40"
                  >
                    {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Payout"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}