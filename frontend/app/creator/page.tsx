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
  X
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

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-20">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="badge-mono bg-[#0284C7] text-white font-bold">DUAL_SIDED_MARKETPLACE</span>
              <span className="font-mono text-xs text-[#64748B]">// Creator Studio & 80/20 Royalties</span>
            </div>
            <h1 className="font-sans font-black text-3xl sm:text-4xl text-black tracking-tight">
              Creator Studio & Royalties
            </h1>
          </div>

          {/* Revenue Split Badge */}
          <div className="flex items-center gap-2 border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 rounded-lg text-xs font-mono">
            <span className="text-[#10B981] font-bold">80% CREATOR ROYALTY</span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="text-[#64748B]">20% PLATFORM TREASURY</span>
          </div>
        </div>

        {/* ── Creator Switcher Tabs ── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {creators.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCreatorId(c.id)}
              className={`px-4 py-2.5 text-xs font-sans font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedCreatorId === c.id
                  ? "bg-black text-white shadow-xs"
                  : "bg-[#F8FAFC] text-[#64748B] hover:text-black border border-[#E2E8F0]"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[0.62rem] font-mono px-1.5 py-0.5 rounded bg-white/20 text-current">
                {c.models_count} Models
              </span>
            </button>
          ))}
        </div>

        {/* ── Earnings Metric Cards ── */}
        {earnings && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="border border-[#E2E8F0] bg-white rounded-lg p-6 shadow-xs">
              <span className="font-mono text-xs text-[#64748B] uppercase block mb-1">
                AVAILABLE_FOR_PAYOUT
              </span>
              <div className="font-sans font-black text-3xl text-black mb-1">
                {earnings.pending_payout_credits.toFixed(2)} <span className="text-sm font-semibold text-[#64748B]">Credits</span>
              </div>
              <div className="text-xs font-mono text-[#10B981] font-semibold">
                ≈ ${earnings.pending_payout_usd.toFixed(2)} USD
              </div>
            </div>

            <div className="border border-[#E2E8F0] bg-white rounded-lg p-6 shadow-xs">
              <span className="font-mono text-xs text-[#64748B] uppercase block mb-1">
                LIFETIME_ROYALTY_EARNINGS
              </span>
              <div className="font-sans font-black text-3xl text-black mb-1">
                {earnings.lifetime_earnings_credits.toFixed(2)} <span className="text-sm font-semibold text-[#64748B]">Credits</span>
              </div>
              <div className="text-xs font-mono text-[#0284C7] font-semibold">
                ≈ ${earnings.lifetime_earnings_usd.toFixed(2)} USD
              </div>
            </div>

            <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg p-6 flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs text-[#64748B] uppercase block mb-1">
                  PAYOUT_SETTLEMENT
                </span>
                <div className="text-xs font-sans text-[#475569] mb-3">
                  Withdraw earned model inference revenue to fiat bank account or USDC crypto wallet.
                </div>
              </div>
              <button
                onClick={() => {
                  setPayoutReceipt(null);
                  setPayoutError(null);
                  setShowPayoutModal(true);
                }}
                className="btn-solid-black w-full py-2 text-xs font-semibold gap-1.5"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Request Payout</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Published Models Portfolio ── */}
        <div className="border border-[#E2E8F0] bg-white rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-black uppercase">
              PUBLISHED_MODELS // MONETIZATION_STATUS
            </span>
            <span className="font-mono text-xs text-[#10B981] font-semibold">
              80% REVENUE SHARE ACTIVE
            </span>
          </div>

          <div className="p-6">
            <p className="text-xs font-sans text-[#64748B] leading-relaxed">
              Every inference stream executed through AgentHub automatically calculates token usage and allocates 80% of metered fees directly into the Creator's treasury wallet.
            </p>
          </div>
        </div>
      </main>

      {/* ── Payout Withdrawal Modal ── */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayoutModal(false)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded bg-black flex items-center justify-center text-white">
                <Landmark className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-base text-black">
                  Request Creator Payout
                </h3>
                <span className="font-mono text-[0.68rem] text-[#64748B]">
                  ID: {selectedCreatorId}
                </span>
              </div>
            </div>

            {payoutReceipt ? (
              <div className="space-y-4 pt-2">
                <div className="bg-[#F0FDF4] border border-[#DCFCE7] p-4 rounded-lg text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto mb-2" />
                  <h4 className="font-sans font-bold text-sm text-[#166534]">
                    Payout Transfer Dispatched!
                  </h4>
                  <p className="text-xs font-mono text-[#15803D] mt-1">
                    Amount: ${payoutReceipt.amount_usd.toFixed(2)} USD ({payoutReceipt.amount_credits} Credits)
                  </p>
                </div>

                <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded text-xs font-mono space-y-1">
                  <div>REFERENCE: <strong className="text-black">{payoutReceipt.reference_id}</strong></div>
                  <div>DESTINATION: <strong className="text-black">{payoutReceipt.destination_address}</strong></div>
                  <div>STATUS: <span className="text-[#10B981] font-bold">{payoutReceipt.status}</span></div>
                </div>

                <button
                  onClick={() => setShowPayoutModal(false)}
                  className="btn-solid-black w-full py-2 text-xs font-semibold"
                >
                  Close Receipt
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecutePayout} className="space-y-4">
                {payoutError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-xs font-sans">
                    {payoutError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono uppercase text-[#64748B] mb-1">
                    WITHDRAWAL_METHOD
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full border border-[#E2E8F0] bg-[#F8FAFC] rounded p-2 text-xs font-sans text-black"
                  >
                    <option value="stripe_connect">Stripe Connect (US / Global ACH)</option>
                    <option value="crypto_usdc">Crypto USDC (Polygon / Arbitrum)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#64748B] mb-1">
                    DESTINATION_ACCOUNT
                  </label>
                  <input
                    type="text"
                    value={destAddress}
                    onChange={(e) => setDestAddress(e.target.value)}
                    className="w-full border border-[#E2E8F0] bg-[#F8FAFC] rounded p-2 text-xs font-mono text-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-[#64748B] mb-1">
                    CREDIT_AMOUNT ({earnings ? `${earnings.pending_payout_credits.toFixed(0)} Max` : ""})
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(Number(e.target.value))}
                    className="w-full border border-[#E2E8F0] bg-[#F8FAFC] rounded p-2 text-xs font-mono text-black"
                    min={1}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="btn-solid-black w-full py-2.5 text-xs font-semibold mt-4"
                >
                  {payoutLoading ? "Processing Transfer..." : `Withdraw $${(payoutAmount * 0.01).toFixed(2)} USD`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}