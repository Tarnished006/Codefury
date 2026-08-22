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
  Plus,
  Loader2,
  Shield,
  Play
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import {
  fetchCreators,
  fetchCreatorEarnings,
  requestCreatorPayout,
  fetchModels,
  createModel,
  fetchProfileDetails,
  convertToCreator,
  deleteModel,
  updateModel,
  fetchCreatorTransactions
} from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";

export default function CreatorPage() {
  const { user, convertToCreator: convertAuthToCreator } = useAuthContext();
  const isCreatorRole = user?.role === "creator";

  const [creators, setCreators] = useState<any[]>([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState("creator_meta");
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Convert Account State
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Creator Role State
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [myEarnings, setMyEarnings] = useState<any>(null);
  const [myModels, setMyModels] = useState<any[]>([]);
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"publish" | "payout" | "models">("publish");

  // Model Publishing Form State
  const [modelName, setModelName] = useState("");
  const [repoId, setRepoId] = useState("");
  const [domain, setDomain] = useState("LLM CHAT");
  const [taskTag, setTaskTag] = useState("REASONING");
  const [description, setDescription] = useState("");
  const [contextLength, setContextLength] = useState(8192);
  const [parameters, setParameters] = useState("8B");
  const [pricePer1k, setPricePer1k] = useState(0.12);
  const [purchasePrice, setPurchasePrice] = useState(100.0);
  const [pubLoading, setPubLoading] = useState(false);
  const [pubSuccess, setPubSuccess] = useState<string | null>(null);
  const [pubError, setPubError] = useState<string | null>(null);

  // Edit Model State
  const [editingModel, setEditingModel] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDomain, setEditDomain] = useState("LLM CHAT");
  const [editTaskTag, setEditTaskTag] = useState("");
  const [editContextLength, setEditContextLength] = useState(8192);
  const [editParameters, setEditParameters] = useState("8B");
  const [editPricePer1k, setEditPricePer1k] = useState(0.12);
  const [editPurchasePrice, setEditPurchasePrice] = useState(100.0);
  const [editIsOnline, setEditIsOnline] = useState(true);
  const [editLoading, setEditLoading] = useState(false);

  // Payout Form State
  const [payoutAmount, setPayoutAmount] = useState(100);
  const [payoutMethod, setPayoutMethod] = useState("stripe_connect");
  const [destAddress, setDestAddress] = useState("acct_1NZ4567890_us_bank");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutReceipt, setPayoutReceipt] = useState<any>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!isCreatorRole && selectedCreatorId) {
      loadEarnings(selectedCreatorId);
    }
  }, [selectedCreatorId, isCreatorRole]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isCreatorRole) {
        const profile = await fetchProfileDetails();
        setCreatorProfile(profile);
        if (profile.creator_id) {
          const earn = await fetchCreatorEarnings(profile.creator_id);
          setMyEarnings(earn);
          try {
            const txs = await fetchCreatorTransactions();
            setMyTransactions(txs);
          } catch (e) {
            console.error("Error fetching creator transactions", e);
          }
        }
        const allModels = await fetchModels();
        if (profile.creator_id) {
          setMyModels(allModels.filter((m: any) => m.creator_id === profile.creator_id));
        } else {
          setMyModels([]);
        }
      } else {
        const data = await fetchCreators();
        setCreators(data);
        if (data.length > 0) setSelectedCreatorId(data[0].id);
      }
    } catch (e) {
      console.error("Data load error", e);
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

  const handleConvertToCreator = async () => {
    setConvertLoading(true);
    setConvertError(null);
    try {
      const res = await convertAuthToCreator();
      if (res.success) {
        window.location.reload();
      } else {
        setConvertError(res.error || "Failed to convert account.");
      }
    } catch (err: any) {
      setConvertError(err.message || "An error occurred.");
    } finally {
      setConvertLoading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm("Are you sure you want to delete this model? This action is irreversible.")) return;
    try {
      await deleteModel(modelId);
      alert("Model deleted successfully.");
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete model.");
    }
  };

  const startEditing = (m: any) => {
    setEditingModel(m);
    setEditName(m.name);
    setEditDescription(m.description || "");
    setEditDomain(m.domain || "LLM CHAT");
    setEditTaskTag(m.task_tag || "");
    setEditContextLength(m.context_length || 8192);
    setEditParameters(m.parameters || "8B");
    setEditPricePer1k(m.price_per_1k || 0.12);
    setEditPurchasePrice(m.purchase_price || 100.0);
    setEditIsOnline(m.is_online);
  };

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;
    setEditLoading(true);
    try {
      await updateModel(editingModel.id, {
        name: editName,
        description: editDescription,
        domain: editDomain,
        task_tag: editTaskTag,
        context_length: Number(editContextLength),
        parameters: editParameters,
        price_per_1k: Number(editPricePer1k),
        purchase_price: Number(editPurchasePrice),
        is_online: editIsOnline,
      });
      alert("Model updated successfully.");
      setEditingModel(null);
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update model.");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePublishModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setPubLoading(true);
    setPubError(null);
    setPubSuccess(null);
    try {
      const created = await createModel({
        name: modelName,
        repo_id: repoId,
        domain,
        task_tag: taskTag,
        description,
        context_length: Number(contextLength),
        parameters,
        price_per_1k: Number(pricePer1k),
        purchase_price: Number(purchasePrice)
      });
      setPubSuccess(`Model "${created.name}" published successfully!`);
      setModelName("");
      setRepoId("");
      setDescription("");
      loadData();
    } catch (err: any) {
      setPubError(err.message || "Failed to publish model");
    } finally {
      setPubLoading(false);
    }
  };

  const handleExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError(null);
    const targetCid = isCreatorRole ? creatorProfile?.creator_id : selectedCreatorId;
    if (!targetCid) {
      setPayoutError("No creator profile found.");
      setPayoutLoading(false);
      return;
    }
    try {
      const receipt = await requestCreatorPayout({
        creator_id: targetCid,
        amount_credits: Number(payoutAmount),
        payout_method: payoutMethod,
        destination_address: destAddress,
      });
      setPayoutReceipt(receipt);
      if (isCreatorRole) {
        const earn = await fetchCreatorEarnings(targetCid);
        setMyEarnings(earn);
      } else {
        loadEarnings(selectedCreatorId);
      }
    } catch (err: any) {
      setPayoutError(err.message || "Payout failed");
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center font-mono text-xs uppercase tracking-widest gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-black" />
        <span>[ INITIALIZING_CREATOR_STUDIO ]</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">

        {/* ── Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-mono bg-black text-white font-bold">
                {isCreatorRole ? "CREATOR_STUDIO" : "DUAL_SIDED_MARKETPLACE"}
              </span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
                // {isCreatorRole ? "Publish & Monetize AI Models" : "Browse Creator Ecosystem"}
              </span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              {isCreatorRole ? "creator dashboard." : "creator studio."}
            </h1>
          </div>

          {/* Revenue Split Badge */}
          <div className="flex items-center gap-3 border border-black/10 bg-black/[0.02] px-4 py-2 text-xs font-mono">
            <span className="text-[#10B981] font-bold">80% CREATOR ROYALTY</span>
            <span className="text-black/20">/</span>
            <span className="text-black/60 font-semibold">20% PLATFORM TREASURY</span>
          </div>
        </div>

        {/* ── CREATOR ROLE DASHBOARD ── */}
        {isCreatorRole ? (
          <div className="space-y-8">

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-black/10 bg-black/[0.015] p-6 space-y-2">
                <div className="font-mono text-[10px] font-bold text-black/50 uppercase tracking-widest flex items-center justify-between">
                  <span>PENDING_PAYOUT_BALANCE</span>
                  <DollarSign className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="font-mono text-3xl font-extrabold text-black">
                  CR {myEarnings?.pending_payout_credits ? myEarnings.pending_payout_credits.toFixed(2) : "0.00"}
                </div>
                <div className="font-mono text-xs text-black/50">
                  ≈ ${(myEarnings?.pending_payout_usd || 0).toFixed(2)} USD available for payout
                </div>
              </div>

              <div className="border border-black/10 bg-black/[0.015] p-6 space-y-2">
                <div className="font-mono text-[10px] font-bold text-black/50 uppercase tracking-widest flex items-center justify-between">
                  <span>LIFETIME_ROYALTIES</span>
                  <TrendingUp className="w-4 h-4 text-[#FF4500]" />
                </div>
                <div className="font-mono text-3xl font-extrabold text-black">
                  CR {myEarnings?.lifetime_earnings_credits ? myEarnings.lifetime_earnings_credits.toFixed(2) : "0.00"}
                </div>
                <div className="font-mono text-xs text-black/50">
                  ≈ ${(myEarnings?.lifetime_earnings_usd || 0).toFixed(2)} USD accumulated
                </div>
              </div>

              <div className="border border-black/10 bg-black/[0.015] p-6 space-y-2">
                <div className="font-mono text-[10px] font-bold text-black/50 uppercase tracking-widest flex items-center justify-between">
                  <span>PUBLISHED_MODELS</span>
                  <Layers className="w-4 h-4 text-black" />
                </div>
                <div className="font-mono text-3xl font-extrabold text-black">
                  {myModels.length}
                </div>
                <div className="font-mono text-xs text-black/50">
                  Active models on live AgentNet registry
                </div>
              </div>
            </div>

            {/* Creator Navigation Tabs */}
            <div className="flex border-b border-black/10 font-mono text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab("publish")}
                className={`px-6 py-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "publish" ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish AI Model</span>
              </button>

              <button
                onClick={() => setActiveTab("payout")}
                className={`px-6 py-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "payout" ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Request Revenue Payout</span>
              </button>

              <button
                onClick={() => setActiveTab("models")}
                className={`px-6 py-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "models" ? "border-black text-black" : "border-transparent text-black/40 hover:text-black"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>My Published Models ({myModels.length})</span>
              </button>
            </div>

            {/* TAB 1: PUBLISH MODEL */}
            {activeTab === "publish" && (
              <div className="border border-black/10 bg-white p-8 max-w-3xl">
                <div className="flex items-center justify-between mb-6 border-b border-black/10 pb-4">
                  <div>
                    <h2 className="font-sans font-bold text-xl text-black">Publish AI Model to Marketplace</h2>
                    <p className="font-mono text-xs text-black/50 uppercase mt-0.5">
                      Deploy your custom open weight or fine-tuned model and earn 80% per token call & purchase.
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-[#FF4500]" />
                </div>

                {pubSuccess && (
                  <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{pubSuccess}</span>
                  </div>
                )}

                {pubError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pubError}</span>
                  </div>
                )}

                <form onSubmit={handlePublishModel} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        MODEL_NAME *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. DeepCoder-33B-Instruct"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        HUGGING_FACE_REPO_ID *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. org/DeepCoder-33B-Instruct"
                        value={repoId}
                        onChange={(e) => setRepoId(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        DOMAIN *
                      </label>
                      <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      >
                        <option value="LLM CHAT">LLM CHAT</option>
                        <option value="CODE GEN">CODE GEN</option>
                        <option value="VISION AI">VISION AI</option>
                        <option value="HEALTHCARE">HEALTHCARE</option>
                        <option value="FINANCE">FINANCE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        TASK_TAG *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PYTHON REASONING"
                        value={taskTag}
                        onChange={(e) => setTaskTag(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                      MODEL_DESCRIPTION
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of model capabilities, benchmarks, and target use cases..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        CONTEXT_LENGTH (TOKENS)
                      </label>
                      <input
                        type="number"
                        value={contextLength}
                        onChange={(e) => setContextLength(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        PARAMETERS
                      </label>
                      <input
                        type="text"
                        value={parameters}
                        onChange={(e) => setParameters(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        PRICE_PER_1K ($ USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={pricePer1k}
                        onChange={(e) => setPricePer1k(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        PURCHASE_PRICE (CREDITS)
                      </label>
                      <input
                        type="number"
                        step="1.0"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pubLoading}
                    className="btn-solid-black w-full py-3 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    {pubLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>PUBLISHING_TO_REGISTRY...</span>
                      </>
                    ) : (
                      <span>PUBLISH MODEL TO MARKETPLACE</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: REQUEST PAYOUT */}
            {activeTab === "payout" && (
              <div className="space-y-8">
                <div className="border border-black/10 bg-white p-8 max-w-2xl">
                  <div className="flex items-center justify-between mb-6 border-b border-black/10 pb-4">
                    <div>
                      <h2 className="font-sans font-bold text-xl text-black">Request Revenue Payout</h2>
                      <p className="font-mono text-xs text-black/50 uppercase mt-0.5">
                        Withdraw accumulated royalties directly via Stripe Connect or USDC.
                      </p>
                    </div>
                    <Landmark className="w-5 h-5 text-[#10B981]" />
                  </div>

                  {payoutReceipt && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-xs font-mono space-y-1 text-emerald-900">
                      <div className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Payout Processed Successfully!</span>
                      </div>
                      <div>Ref ID: {payoutReceipt.reference_id}</div>
                      <div>Amount: {payoutReceipt.amount_credits} CR (${payoutReceipt.amount_usd} USD)</div>
                      <div>Status: {payoutReceipt.status}</div>
                    </div>
                  )}

                  {payoutError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{payoutError}</span>
                    </div>
                  )}

                  <form onSubmit={handleExecutePayout} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        PAYOUT_AMOUNT (CREDITS)
                      </label>
                      <input
                        type="number"
                        min={10}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                      <span className="text-[10px] font-mono text-black/40 mt-1 block uppercase">
                        Min payout threshold: 10 CR ($0.10 USD). Current available: {myEarnings?.pending_payout_credits || 0} CR
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        PAYOUT_METHOD
                      </label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      >
                        <option value="stripe_connect">Stripe Connect (Bank Direct Deposit)</option>
                        <option value="crypto_usdc">Crypto USDC (Solana / Ethereum)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                        DESTINATION_ADDRESS / ACCOUNT_ID
                      </label>
                      <input
                        type="text"
                        required
                        value={destAddress}
                        onChange={(e) => setDestAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="btn-solid-black w-full py-3 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      {payoutLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>PROCESSING_PAYOUT...</span>
                        </>
                      ) : (
                        <span>EXECUTE PAYOUT WITHDRAWAL</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Transaction Log */}
                <div className="border border-black/10 bg-white overflow-hidden max-w-3xl">
                  <div className="px-6 py-4 bg-black/[0.02] border-b border-black/10 font-mono text-xs font-bold uppercase tracking-widest text-black flex items-center justify-between">
                    <span>Royalty & Payout Transaction Ledger</span>
                    <span className="text-[10px] text-black/40">{myTransactions.length} entries</span>
                  </div>
                  <div className="divide-y divide-black/10 max-h-80 overflow-y-auto">
                    {myTransactions.length === 0 ? (
                      <div className="p-8 text-center text-xs font-mono text-black/40 uppercase">
                        No transactions recorded yet.
                      </div>
                    ) : (
                      myTransactions.map((tx) => (
                        <div key={tx.id} className="p-4 px-6 flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="font-bold text-black uppercase">{tx.description || `${tx.transaction_type} for Model ${tx.model_name || tx.model_id}`}</div>
                            <div className="text-[10px] text-black/40 mt-0.5 uppercase">{new Date(tx.created_at).toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#10B981]">
                              +CR {tx.creator_royalty_credits ? tx.creator_royalty_credits.toFixed(2) : "0.00"}
                            </div>
                            <span className="text-[10px] text-black/40 uppercase font-semibold">Royalty Split</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MY PUBLISHED MODELS */}
            {activeTab === "models" && (
              <div className="space-y-6">
                {editingModel ? (
                  <div className="border border-black/10 bg-white p-8 max-w-3xl">
                    <div className="flex items-center justify-between mb-6 border-b border-black/10 pb-4">
                      <div>
                        <h2 className="font-sans font-bold text-xl text-black">Edit Model Details</h2>
                        <p className="font-mono text-xs text-black/50 uppercase mt-0.5">
                          Modify attributes for model: {editingModel.name}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingModel(null)}
                        className="px-3 py-1 bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleUpdateModel} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            MODEL_NAME *
                          </label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            DOMAIN *
                          </label>
                          <select
                            value={editDomain}
                            onChange={(e) => setEditDomain(e.target.value)}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          >
                            <option value="LLM CHAT">LLM CHAT</option>
                            <option value="CODE GEN">CODE GEN</option>
                            <option value="VISION AI">VISION AI</option>
                            <option value="HEALTHCARE">HEALTHCARE</option>
                            <option value="FINANCE">FINANCE</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            TASK_TAG *
                          </label>
                          <input
                            type="text"
                            required
                            value={editTaskTag}
                            onChange={(e) => setEditTaskTag(e.target.value)}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            STATUS *
                          </label>
                          <select
                            value={editIsOnline ? "online" : "offline"}
                            onChange={(e) => setEditIsOnline(e.target.value === "online")}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          >
                            <option value="online">ONLINE</option>
                            <option value="offline">OFFLINE</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                          MODEL_DESCRIPTION
                        </label>
                        <textarea
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            CONTEXT_LENGTH
                          </label>
                          <input
                            type="number"
                            value={editContextLength}
                            onChange={(e) => setEditContextLength(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            PARAMETERS
                          </label>
                          <input
                            type="text"
                            value={editParameters}
                            onChange={(e) => setEditParameters(e.target.value)}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            PRICE/1K
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editPricePer1k}
                            onChange={(e) => setEditPricePer1k(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                            PURCHASE_PRICE
                          </label>
                          <input
                            type="number"
                            step="1.0"
                            value={editPurchasePrice}
                            onChange={(e) => setEditPurchasePrice(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={editLoading}
                        className="btn-solid-black w-full py-3 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>SAVE CHANGES</span>}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="border border-black/10 bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/10 font-mono text-xs font-bold uppercase tracking-widest bg-black/[0.02]">
                      MY PUBLISHED MODELS ({myModels.length})
                    </div>

                    {myModels.length === 0 ? (
                      <div className="p-8 text-center font-mono text-xs text-black/50 uppercase">
                        No models published yet. Click "Publish AI Model" to get started!
                      </div>
                    ) : (
                      <div className="divide-y divide-black/10">
                        {myModels.map((m: any) => (
                          <div key={m.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="font-sans font-bold text-base text-black">{m.name}</div>
                              <div className="font-mono text-xs text-black/50 mt-0.5">{m.repo_id}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="font-mono text-[9px] font-bold px-2 py-0.5 bg-black/[0.03] border border-black/10 uppercase">
                                  {m.domain}
                                </span>
                                <span className="font-mono text-[9px] text-black/40 uppercase">
                                  CTX: {m.context_length} tok
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-6 font-mono text-xs">
                              <div>
                                <span className="text-[10px] text-black/40 block uppercase">PRICE/1K</span>
                                <strong className="text-black">${m.price_per_1k}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-black/40 block uppercase">PURCHASE_PRICE</span>
                                <strong className="text-black">${m.purchase_price ?? 100}</strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-black/40 block uppercase">STATUS</span>
                                <span className={m.is_online ? "text-[#10B981] font-bold" : "text-black/45 font-bold"}>
                                  {m.is_online ? "ONLINE" : "OFFLINE"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditing(m)}
                                  className="px-3 py-1.5 border border-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(m.id)}
                                  className="px-3 py-1.5 border border-red-500 text-red-500 text-xs font-mono font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          /* ── BROWSER MODE FOR STANDARD DEVELOPERS / VISITORS ── */
          <div>
            <div className="mb-8 p-6 bg-black/[0.02] border border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans font-bold text-lg text-black">Are you an AI model developer?</h3>
                <p className="font-mono text-xs text-black/60 uppercase mt-1">
                  Deploy your fine-tuned models on AgentNet to earn an 80% royalty split on every token call.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="/register"
                  className="btn-solid-black py-2.5 px-5 text-xs font-mono font-bold uppercase tracking-wider shrink-0 text-center animate-pulse"
                >
                  Register as Creator
                </a>
                {user && (
                  <button
                    onClick={handleConvertToCreator}
                    disabled={convertLoading}
                    className="px-5 py-2.5 border border-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all disabled:opacity-50 shrink-0"
                  >
                    {convertLoading ? "Converting..." : "Convert Current Account"}
                  </button>
                )}
              </div>
            </div>
            {convertError && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
                {convertError}
              </div>
            )}

            {/* Creator Switcher Tabs */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
              {creators.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCreatorId(c.id)}
                  className={`px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2.5 ${
                    selectedCreatorId === c.id
                      ? "bg-black text-white shadow-sm"
                      : "bg-white text-black/60 border border-black/10 hover:border-black hover:text-black"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-60">({c.models_count})</span>
                </button>
              ))}
            </div>

            {/* Creator Overview Panel */}
            {earnings && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 border border-black/10 bg-white p-8 space-y-6">
                  <div className="flex items-start justify-between border-b border-black/10 pb-6">
                    <div>
                      <h2 className="font-sans font-extrabold text-2xl text-black">{earnings.name}</h2>
                      <div className="font-mono text-xs text-black/50 mt-1">@{earnings.handle}</div>
                    </div>
                    <span className="badge-mono bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 font-bold uppercase">
                      VERIFIED_CREATOR
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="border border-black/5 p-4 bg-black/[0.01]">
                      <span className="font-mono text-[9px] text-black/40 block uppercase">PENDING_PAYOUT</span>
                      <span className="font-mono text-lg font-bold text-black">CR {earnings.pending_payout_credits.toFixed(2)}</span>
                    </div>
                    <div className="border border-black/5 p-4 bg-black/[0.01]">
                      <span className="font-mono text-[9px] text-black/40 block uppercase">USD_EQUIVALENT</span>
                      <span className="font-mono text-lg font-bold text-[#10B981]">${earnings.pending_payout_usd.toFixed(2)}</span>
                    </div>
                    <div className="border border-black/5 p-4 bg-black/[0.01]">
                      <span className="font-mono text-[9px] text-black/40 block uppercase">LIFETIME_ROYALTIES</span>
                      <span className="font-mono text-lg font-bold text-black">CR {earnings.lifetime_earnings_credits.toFixed(2)}</span>
                    </div>
                    <div className="border border-black/5 p-4 bg-black/[0.01]">
                      <span className="font-mono text-[9px] text-black/40 block uppercase">ROYALTY_SPLIT</span>
                      <span className="font-mono text-lg font-bold text-[#FF4500]">80%</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Payout Request Sidecard */}
                <div className="border border-black/10 bg-black/[0.02] p-8 space-y-6">
                  <div className="font-mono text-xs font-bold uppercase text-black/70 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-black" />
                    <span>PUBLIC_CREATOR_PAYOUT</span>
                  </div>
                  <p className="font-mono text-xs text-black/60">
                    Simulate creator payout processing via Stripe Connect or USDC.
                  </p>

                  <form onSubmit={handleExecutePayout} className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="block text-[10px] text-black/40 uppercase font-bold mb-1">AMOUNT_CREDITS</label>
                      <input
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-black/20 bg-white text-black outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="btn-solid-black w-full py-2.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {payoutLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>TRIGGER PAYOUT</span>}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}