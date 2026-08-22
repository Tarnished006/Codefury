"use client";

import { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Lock,
  Wallet,
  Cpu,
  Key,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";
import { fetchProfileDetails, updateProfile, generateApiKey } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Profile Form State
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // API Key Generator State
  const [keyName, setKeyName] = useState("");
  const [keyLoading, setKeyLoading] = useState(false);
  const [newKeyGenerated, setNewKeyGenerated] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showNewKey, setShowNewKey] = useState(true);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  useEffect(() => {
    loadProfileDetails();
  }, []);

  const loadProfileDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProfileDetails();
      setProfileData(data);
      setHandle(data.handle);
      setEmail(data.email);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateSuccess(null);
    setUpdateError(null);

    try {
      const payload: any = {};
      if (handle !== profileData?.handle) payload.handle = handle;
      if (email !== profileData?.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setUpdateError("No changes specified.");
        setUpdateLoading(false);
        return;
      }

      await updateProfile(payload);
      setUpdateSuccess("Profile updated successfully!");
      setPassword("");
      await refreshUser();
      await loadProfileDetails();
    } catch (e: any) {
      setUpdateError(e.message || "Failed to update profile.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    setKeyLoading(true);
    setNewKeyGenerated(null);

    try {
      const res = await generateApiKey(keyName);
      setNewKeyGenerated(res.api_key);
      setKeyName("");
      await loadProfileDetails();
    } catch (e: any) {
      console.error(e);
    } finally {
      setKeyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col justify-between">
        <NeuralNavbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF4500]" />
          <span className="font-mono text-xs text-black/50 uppercase tracking-widest">[ COMPILING_PROFILE_METRICS ]</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <NeuralNavbar />

      <main className="max-w-[1400px] w-full mx-auto px-6 pt-24 pb-16 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Profile Card & Update Form */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* Profile Overview Card */}
            <div className="border border-black/10 p-6 bg-black/[0.01]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-mono font-bold text-xl uppercase">
                  {profileData?.handle.slice(0, 2)}
                </div>
                <div>
                  <h2 className="font-sans font-extrabold text-xl text-black">@{profileData?.handle}</h2>
                  <p className="font-mono text-[9px] text-[#FF4500] uppercase tracking-widest font-semibold">{profileData?.role}</p>
                </div>
              </div>

              <div className="space-y-3 font-mono text-[10px] text-black/60 uppercase border-t border-black/10 pt-4">
                <div className="flex justify-between">
                  <span>USER_ID:</span>
                  <span className="font-bold text-black">{profileData?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>EMAIL_ADDR:</span>
                  <span className="font-bold text-black text-right truncate max-w-[180px]">{profileData?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>CREATED_AT:</span>
                  <span className="font-bold text-black">
                    {new Date(profileData?.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Profile Form */}
            <div className="border border-black/10 p-6">
              <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider mb-4 border-b border-black/10 pb-2">
                EDIT_NEURAL_PROFILE
              </h3>

              {updateSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              {updateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono uppercase text-black/50 font-bold mb-1.5">
                    DEVELOPER_HANDLE
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-black/30 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                      placeholder="developer_handle"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase text-black/50 font-bold mb-1.5">
                    WORK_EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-black/30 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                      placeholder="name@domain.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase text-black/50 font-bold mb-1.5">
                    NEW_PASSWORD (OPTIONAL)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-black/30 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full btn-solid-black py-2.5 text-[9px] font-mono uppercase tracking-widest justify-center disabled:opacity-40"
                >
                  {updateLoading ? "Saving Profile..." : "Update Profile"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Statistics, API Keys, Purchased Models, Tested Models, Ecommerce History */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            
            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="border border-black/10 p-5 bg-black/[0.01] flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] text-black/50 uppercase tracking-widest font-bold">LEDGER_BALANCE</span>
                  <Wallet className="w-4 h-4 text-[#FF4500]" />
                </div>
                <div>
                  <span className="font-sans font-black text-2xl text-black">CR {profileData?.balance_credits.toFixed(2)}</span>
                  <p className="font-mono text-[8px] text-black/40 mt-1 uppercase">Available Inference Credits</p>
                </div>
              </div>

              <div className="border border-black/10 p-5 bg-black/[0.01] flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] text-black/50 uppercase tracking-widest font-bold">TOTAL_SPENT</span>
                  <Layers className="w-4 h-4 text-black/40" />
                </div>
                <div>
                  <span className="font-sans font-black text-2xl text-black">CR {profileData?.total_spent.toFixed(2)}</span>
                  <p className="font-mono text-[8px] text-black/40 mt-1 uppercase">Cumulative Platform Outlays</p>
                </div>
              </div>

              <div className="border border-black/10 p-5 bg-black/[0.01] flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[9px] text-black/50 uppercase tracking-widest font-bold">METERED_TOKENS</span>
                  <Cpu className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <span className="font-sans font-black text-2xl text-black">{profileData?.total_tokens_used.toLocaleString()}</span>
                  <p className="font-mono text-[8px] text-black/40 mt-1 uppercase">GPU Compute Tokens Logged</p>
                </div>
              </div>

            </div>

            {/* Active API Keys & Generator */}
            <div className="border border-black/10 p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#FF4500]" />
                  <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider">
                    PRODUCTION_API_KEYS
                  </h3>
                </div>
                <span className="font-mono text-[9px] text-black/50 uppercase">
                  SHA-256 Secured Client Access
                </span>
              </div>

              {newKeyGenerated && (
                <div className="p-5 bg-orange-50/90 border-2 border-orange-400 font-mono text-[11px] text-orange-950 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-orange-900 uppercase tracking-wider text-xs">
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      New API Key Generated — Copy Now
                    </span>
                    <span className="px-2 py-0.5 bg-orange-200 text-orange-900 text-[9px] font-bold uppercase tracking-wider">
                      One-Time Reveal
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white p-3 border border-orange-300 shadow-sm">
                    <code className="font-mono text-xs font-bold text-black flex-1 break-all select-all">
                      {showNewKey ? newKeyGenerated : "•".repeat(36) + newKeyGenerated.slice(-4)}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowNewKey(!showNewKey)}
                      title={showNewKey ? "Hide key" : "Show key"}
                      className="p-1.5 text-black/60 hover:text-black transition-colors"
                    >
                      {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyGenerated);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2500);
                      }}
                      className="px-3.5 py-2 bg-black text-white hover:bg-[#FF4500] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                    <p className="text-[10px] text-orange-800 leading-relaxed font-sans max-w-md">
                      ⚠️ Once you click <strong>&quot;Done &amp; Encrypt Key&quot;</strong>, the plaintext key is permanently locked and only its SHA-256 hash is preserved. It can never be viewed or copied again.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewKeyGenerated(null);
                        setCopiedKey(false);
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-mono text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Done &amp; Encrypt Key</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {profileData?.api_keys.length === 0 ? (
                  <p className="font-mono text-[10px] text-black/40 uppercase py-3 text-center border border-dashed border-black/10">
                    No active developer keys provisioned yet. Generate your first key below.
                  </p>
                ) : (
                  profileData?.api_keys.map((k: any) => {
                    const maskedPrefix = k.key_prefix || (k.api_key ? k.api_key.slice(0, 12) : "ak_live_••••");

                    return (
                      <div
                        key={k.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/[0.02] border border-black/10 p-3 font-mono text-[10px] hover:border-black/30 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black uppercase">{k.name}</span>
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold">
                              ACTIVE
                            </span>
                            <span className="px-1.5 py-0.2 bg-zinc-100 text-zinc-600 border border-zinc-200 text-[8px] font-mono flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>ENCRYPTED (SHA-256)</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-black/60 font-mono tracking-wider">
                            {maskedPrefix.slice(0, 12)}••••••••••••••••
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-black/40">
                            {new Date(k.created_at).toLocaleDateString()}
                          </span>
                          <span
                            title="For security, raw keys are encrypted on creation and cannot be revealed or copied."
                            className="px-2.5 py-1 bg-zinc-100 text-zinc-500 border border-zinc-200 text-[9px] font-mono font-bold uppercase select-none flex items-center gap-1 cursor-help"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>LOCKED</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Generate Key Inline Form */}
              <form onSubmit={handleCreateApiKey} className="flex gap-2 border-t border-black/10 pt-4">
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Client Mesh Key"
                  className="flex-grow px-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                  required
                />
                <button
                  type="submit"
                  disabled={keyLoading || !keyName.trim()}
                  className="bg-black text-white hover:bg-[#FF4500] px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {keyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Generate Key</span>
                </button>
              </form>
            </div>

            {/* Two-Column Grid: Purchased Models & Tested Models */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Purchased Models */}
              <div className="border border-black/10 p-6">
                <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider mb-4 border-b border-black/10 pb-2">
                  PURCHASED_MODELS
                </h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {profileData?.purchased_models.length === 0 ? (
                    <p className="font-mono text-[10px] text-black/40 uppercase">
                      No models purchased yet. Buy model access in the Marketplace.
                    </p>
                  ) : (
                    profileData?.purchased_models.map((pm: any) => (
                      <div key={pm.id} className="p-3 bg-black/[0.01] border border-black/5 font-mono text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-black uppercase truncate max-w-[180px]">{pm.model_name}</span>
                          <span className="text-emerald-600 font-bold">CR {pm.price_paid}</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-black/40 mt-1.5 uppercase">
                          <span>ID: {pm.model_id}</span>
                          <span>{new Date(pm.purchased_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tested Models */}
              <div className="border border-black/10 p-6">
                <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider mb-4 border-b border-black/10 pb-2">
                  TESTED_MODELS_LOG
                </h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {profileData?.tested_models.length === 0 ? (
                    <p className="font-mono text-[10px] text-black/40 uppercase">
                      No diagnostics logged yet. Test any model in Sandbox or Arena.
                    </p>
                  ) : (
                    profileData?.tested_models.map((tm: any) => (
                      <div key={tm.id} className="p-3 bg-black/[0.01] border border-black/5 font-mono text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-black uppercase truncate max-w-[180px]">{tm.model_name}</span>
                          <span className="text-[8px] text-black/40">{new Date(tm.tested_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[9px] text-black/60 mt-1 uppercase italic">{tm.test_details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Ecommerce & Double-Entry Ledger History */}
            <div className="border border-black/10 p-6">
              <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider mb-4 border-b border-black/10 pb-2 flex items-center justify-between">
                <span>ECOMMERCE_USAGE_HISTORY</span>
                <History className="w-3.5 h-3.5 text-black/40" />
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead>
                    <tr className="border-b border-black/10 uppercase text-black/40 text-[9px] font-bold">
                      <th className="pb-2.5 font-bold">TYPE</th>
                      <th className="pb-2.5 font-bold">DESCRIPTION</th>
                      <th className="pb-2.5 font-bold text-right">COST/CR</th>
                      <th className="pb-2.5 font-bold text-right">DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData?.ecommerce_history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-black/40 uppercase">
                          No transactions found on ledger.
                        </td>
                      </tr>
                    ) : (
                      profileData?.ecommerce_history.map((tx: any) => {
                        const isCredit = tx.transaction_type === "WALLET_TOPUP";
                        return (
                          <tr key={tx.id} className="border-b border-black/5 hover:bg-black/[0.01]">
                            <td className="py-3 font-bold">
                              <span className={`px-1.5 py-0.5 text-[8px] border uppercase ${
                                tx.transaction_type === "WALLET_TOPUP"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : tx.transaction_type === "MODEL_PURCHASE"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-black/[0.02] text-black/60 border-black/10"
                              }`}>
                                {tx.transaction_type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 text-black/70 max-w-[280px] truncate" title={tx.description}>
                              {tx.description}
                            </td>
                            <td className={`py-3 text-right font-bold ${isCredit ? "text-emerald-600" : "text-black"}`}>
                              {isCredit ? "+" : "-"}{tx.cost_credits.toFixed(2)}
                            </td>
                            <td className="py-3 text-right text-black/40">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </main>

      <footer className="border-t border-black/10 py-5 text-center text-[10px] font-mono text-black/40 uppercase tracking-widest">
        AgentNet // Decentralized Economic Mesh
      </footer>
    </div>
  );
}
