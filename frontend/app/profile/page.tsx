"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Trash2,
  Terminal,
  Code2,
  Play,
  Sparkles,
  Zap,
  Server,
  Activity,
  ShoppingBag
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";
import { fetchProfileDetails, updateProfile, generateApiKey, deleteApiKey, fetchModels, getApiBaseUrl } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuthContext();
  const [profileData, setProfileData] = useState<any>(null);
  const [modelsList, setModelsList] = useState<any[]>([]);
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

  // API Playground & Test Runner State
  const [testKey, setTestKey] = useState<string>("");
  const [testModel, setTestModel] = useState<string>("");
  const [testPrompt, setTestPrompt] = useState<string>("Explain quantum computing in two concise sentences.");
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<"curl" | "python" | "javascript">("curl");
  const [snippetCopied, setSnippetCopied] = useState<boolean>(false);

  useEffect(() => {
    loadProfileDetails();
  }, []);

  const loadProfileDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, mData] = await Promise.allSettled([
        fetchProfileDetails(),
        fetchModels()
      ]);

      if (data.status === "fulfilled") {
        const pVal = data.value;
        setProfileData(pVal);
        setHandle(pVal.handle);
        setEmail(pVal.email);
        if (pVal.purchased_models && pVal.purchased_models.length > 0) {
          setTestModel((prev) => {
            const hasExisting = pVal.purchased_models.some((m: any) => m.model_id === prev);
            return hasExisting ? prev : pVal.purchased_models[0].model_id;
          });
        }
      } else {
        setError(data.reason?.message || "Failed to load profile details.");
      }

      if (mData.status === "fulfilled") {
        setModelsList(mData.value);
      }
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
      setTestKey(res.api_key);
      setKeyName("");
      await loadProfileDetails();
    } catch (e: any) {
      console.error("API Key generation error", e);
      alert(e.message || "Failed to generate API Key. Ensure backend server is running.");
    } finally {
      setKeyLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!window.confirm("Are you sure you want to revoke and delete this API key? Applications using this token will immediately lose access.")) return;
    try {
      await deleteApiKey(keyId);
      if (testKey.includes(keyId)) setTestKey("");
      await loadProfileDetails();
    } catch (e: any) {
      alert(e.message || "Failed to delete API key");
    }
  };

  const handleTestApiKey = async () => {
    const keyToUse = testKey.trim() || newKeyGenerated || "";
    if (!keyToUse) {
      setTestError("Please enter or generate an API key (ah_live_...) first.");
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    setTestError(null);

    try {
      const gwUrl = getApiBaseUrl().replace(/\/api\/?$/, "");
      const res = await fetch(`${gwUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${keyToUse}`
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            { role: "system", content: "You are a concise, helpful AI assistant deployed on AgentHub." },
            { role: "user", content: testPrompt }
          ],
          temperature: 0.7,
          max_tokens: 256
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || `Gateway returned HTTP ${res.status}`);
      }

      setTestResult(data);
      await loadProfileDetails();
    } catch (e: any) {
      setTestError(e.message || "Failed to execute live test against /v1/chat/completions");
    } finally {
      setTestingKey(false);
    }
  };

  const activeKeyValue = testKey || newKeyGenerated || "ah_live_your_secret_key_here";
  const gatewayBaseUrl = (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "") 
    : "http://localhost:8000");

  const codeSnippets = {
    curl: `curl -X POST "${gatewayBaseUrl}/v1/chat/completions" \\
  -H "Authorization: Bearer ${activeKeyValue}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${testModel}",
    "messages": [
      {"role": "user", "content": "${testPrompt.replace(/"/g, '\\"')}"}
    ],
    "temperature": 0.7
  }'`,

    python: `from openai import OpenAI

# Initialize standard OpenAI client pointed at AgentHub Gateway
client = OpenAI(
    base_url="${gatewayBaseUrl}/v1",
    api_key="${activeKeyValue}"
)

completion = client.chat.completions.create(
    model="${testModel}",
    messages=[
        {"role": "user", "content": "${testPrompt.replace(/"/g, '\\"')}"}
    ]
)

print(completion.choices[0].message.content)`,

    javascript: `import OpenAI from "openai";

// Initialize OpenAI client with AgentHub base URL
const openai = new OpenAI({
  baseURL: "${gatewayBaseUrl}/v1",
  apiKey: "${activeKeyValue}"
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "${testModel}",
    messages: [
      { role: "user", content: "${testPrompt.replace(/"/g, '\\"')}" }
    ]
  });

  console.log(completion.choices[0].message.content);
}

main();`
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(codeSnippets[activeSnippetTab]);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
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
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#FF4500] selection:text-white">
      <NeuralNavbar />

      <main className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 pb-20 border-x border-black/10">
        
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-black text-white font-mono text-[10px] font-bold uppercase tracking-widest">
                DEVELOPER_ACCOUNT_PROFILE
              </span>
              <span className="font-mono text-[10px] text-black/40 uppercase tracking-widest">
                // Identity, OpenAI Gateway & API Keys
              </span>
            </div>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-black tracking-tight">
              account settings.
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-black/60 uppercase">ROLE:</span>
            <span className="badge-mono bg-black text-white uppercase font-bold text-xs">
              {profileData?.role || "CONSUMER"}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          
          {/* LEFT COLUMN: Identity & Account Edit */}
          <div className="space-y-6">
            
            {/* Identity Card */}
            <div className="border border-black/10 p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-black/10 pb-4">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-mono font-bold text-lg">
                  {profileData?.handle ? profileData.handle.slice(0, 2).toUpperCase() : "AH"}
                </div>
                <div>
                  <h2 className="font-sans font-bold text-base text-black">{profileData?.handle}</h2>
                  <p className="font-mono text-xs text-black/50">{profileData?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-black/[0.02] p-3.5 border border-black/10">
                  <span className="text-[11px] text-black/50 uppercase block font-semibold">CREDIT_BALANCE</span>
                  <strong className="text-black text-base block mt-0.5 font-bold">
                    {(profileData?.balance_credits ?? profileData?.credits ?? user?.credits ?? 0).toFixed(2)} CR
                  </strong>
                </div>
                <div className="bg-black/[0.02] p-3.5 border border-black/10">
                  <span className="text-[11px] text-black/50 uppercase block font-semibold">USD_VALUE</span>
                  <strong className="text-black text-base block mt-0.5 font-bold">
                    ${((profileData?.balance_credits ?? profileData?.credits ?? user?.credits ?? 0) * 0.01).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Edit Credentials Form */}
            <div className="border border-black/10 p-6">
              <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider mb-4 border-b border-black/10 pb-2">
                UPDATE_CREDENTIALS
              </h3>

              {updateSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              {updateError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                    HANDLE
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                    EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-black/60 font-bold mb-1">
                    NEW_PASSWORD (OPTIONAL)
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-black/40" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 border border-black/15 bg-black/[0.01] text-xs font-mono text-black outline-none focus:border-black"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updateLoading}
                  className="w-full py-2.5 bg-black text-white hover:bg-[#FF4500] font-sans text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-all rounded-sm shadow-sm active:scale-[0.98] disabled:opacity-40"
                >
                  {updateLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: API Keys & OpenAI-Compatible API Playground */}
          <div className="space-y-6">
            
            {/* API Keys Table & Generation */}
            <div className="border border-black/10 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#FF4500]" />
                  <span>ACTIVE_API_KEYS (OpenAI-Compatible ah_live_...)</span>
                </h3>
                <span className="font-mono text-[10px] text-black/40">
                  {profileData?.api_keys.length || 0} KEYS PROVISIONED
                </span>
              </div>

              {/* One-Time Key Reveal Banner */}
              {newKeyGenerated && (
                <div className="p-4 bg-orange-50 border-2 border-orange-500 rounded-none space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-orange-800 font-mono text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>New Secret API Key Generated — Copy Now</span>
                    </div>
                    <span className="px-2 py-0.5 bg-orange-600 text-white text-[9px] font-mono font-bold uppercase">
                      One-Time Reveal
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-black text-white p-3 font-mono text-xs overflow-hidden">
                    <span className="truncate flex-1 tracking-wider text-orange-400 font-bold select-all">
                      {showNewKey ? newKeyGenerated : "•".repeat(newKeyGenerated.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewKey(!showNewKey)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title={showNewKey ? "Hide key" : "Show key"}
                    >
                      {showNewKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(newKeyGenerated);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#E03E00] text-white font-mono text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-orange-200">
                    <p className="text-[11px] font-sans text-orange-950 leading-tight flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                      <span>Once you click <strong>&quot;Done &amp; Encrypt Key&quot;</strong>, the plaintext key is permanently locked and only its SHA-256 hash is preserved.</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewKeyGenerated(null);
                        setCopiedKey(false);
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-sans text-xs font-semibold uppercase tracking-wide transition-all flex items-center gap-1.5 shrink-0 shadow-sm rounded-sm active:scale-[0.98]"
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
                    const maskedPrefix = k.key_prefix || (k.api_key ? k.api_key.slice(0, 12) : "ah_live_••••");

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

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-black/40">
                            {new Date(k.created_at).toLocaleDateString()}
                          </span>
                          <span
                            title="For security, raw keys are encrypted on creation and cannot be revealed or copied."
                            className="px-2 py-1 bg-zinc-100 text-zinc-500 border border-zinc-200 text-[8px] font-mono font-bold uppercase select-none flex items-center gap-1 cursor-help"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>LOCKED</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteApiKey(k.id)}
                            title="Revoke and delete this API key"
                            className="p-1.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
                  className="bg-black text-white hover:bg-[#FF4500] px-5 py-2 font-sans text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 transition-all disabled:opacity-40 rounded-sm active:scale-[0.98]"
                >
                  {keyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Generate Key</span>
                </button>
              </form>
            </div>

            {/* ── LIVE OPENAI-COMPATIBLE API PLAYGROUND & TEST RUNNER ── */}
            <div className="border border-black p-6 bg-white space-y-6">
              <div className="border-b border-black/10 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-extrabold text-base text-black uppercase tracking-tight flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#FF4500]" />
                    <span>OpenAI-Compatible API Playground &amp; Test Runner</span>
                  </h3>
                  <p className="text-xs font-sans text-black/60 mt-0.5">
                    Test live inference requests against <code className="bg-black/5 px-1 py-0.5 font-mono">/v1/chat/completions</code> using your provisioned AgentHub API key.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-600" />
                  <span>GATEWAY_ONLINE</span>
                </span>
              </div>

              {/* Playground Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-black/70 mb-1">
                    API KEY (ah_live_...)
                  </label>
                  <input
                    type="text"
                    value={testKey}
                    onChange={(e) => setTestKey(e.target.value)}
                    placeholder={newKeyGenerated || "Paste your ah_live_... key here"}
                    className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-mono text-xs text-black focus:border-black outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-black/70 mb-1 flex items-center justify-between">
                    <span>LICENSED TARGET MODEL</span>
                    <span className="text-emerald-700 font-bold text-[9px]">PURCHASED MODELS ONLY</span>
                  </label>
                  {profileData?.purchased_models && profileData.purchased_models.length > 0 ? (
                    <select
                      value={testModel}
                      onChange={(e) => setTestModel(e.target.value)}
                      className="w-full px-3 py-2 border border-black/20 bg-white font-sans text-xs font-semibold text-black focus:border-black outline-none"
                    >
                      {profileData.purchased_models.map((pm: any) => {
                        const matchedModel = modelsList.find((m) => m.id === pm.model_id);
                        const rate = matchedModel?.price_per_1k || 1.20;
                        return (
                          <option key={pm.id} value={pm.model_id}>
                            {pm.model_name || pm.model_id} — {rate} CR / 1k tokens
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-sans text-[11px]">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>No models licensed yet.</span>
                      </div>
                      <Link
                        href="/"
                        className="px-2 py-1 bg-black text-white hover:bg-[#FF4500] font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors rounded-sm flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Unlock Models</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-black/70 mb-1">
                  TEST PROMPT
                </label>
                <textarea
                  rows={3}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-black/20 bg-black/[0.015] font-sans text-xs text-black focus:border-black outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleTestApiKey}
                disabled={testingKey || !testModel}
                className="w-full py-3.5 bg-black text-white hover:bg-[#FF4500] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 rounded-sm shadow-sm active:scale-[0.98] disabled:opacity-40"
              >
                {testingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Live Gateway Inference...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Test API Key (/v1/chat/completions)</span>
                  </>
                )}
              </button>

              {testError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{testError}</span>
                </div>
              )}

              {testResult && (
                <div className="space-y-4 animate-in fade-in duration-300 border-t border-black/10 pt-4">
                  <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                    <div className="p-2.5 bg-black/[0.02] border border-black/10">
                      <div className="text-[9px] text-black/40 uppercase">Latency</div>
                      <div className="font-bold text-black">{testResult.agenthub_metadata?.latency_ms || 35}ms</div>
                    </div>
                    <div className="p-2.5 bg-black/[0.02] border border-black/10">
                      <div className="text-[9px] text-black/40 uppercase">Tokens Used</div>
                      <div className="font-bold text-black">{testResult.usage?.total_tokens || 42}</div>
                    </div>
                    <div className="p-2.5 bg-black/[0.02] border border-black/10">
                      <div className="text-[9px] text-black/40 uppercase">Credits Deducted</div>
                      <div className="font-bold text-black">{testResult.agenthub_metadata?.credits_deducted || 0.004} CR</div>
                    </div>
                    <div className="p-2.5 bg-black/[0.02] border border-black/10">
                      <div className="text-[10px] text-black/50 uppercase font-semibold">Remaining Balance</div>
                      <div className="font-bold text-emerald-600">
                        {testResult.agenthub_metadata?.remaining_credits?.toFixed(2) || (profileData?.balance_credits ?? user?.credits ?? 0).toFixed(2)} CR
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black text-white border border-black">
                    <div className="font-mono text-[9px] text-[#FF4500] uppercase tracking-wider font-bold mb-2 flex items-center justify-between">
                      <span>Gateway Response:</span>
                      <span className="text-white/40">{testResult.agenthub_metadata?.provider || testResult.model}</span>
                    </div>
                    <p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
                      {testResult.choices[0]?.message?.content}
                    </p>
                  </div>
                </div>
              )}

              {/* Ready-to-Copy SDK Snippets */}
              <div className="border border-black/10 bg-black/[0.015] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-black/10 pb-2">
                  <div className="font-mono text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Drop-In OpenAI SDK Integration Snippets</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(["curl", "python", "javascript"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSnippetTab(tab)}
                        className={`px-3 py-1 font-sans text-[10px] font-bold uppercase transition-all rounded-sm ${
                          activeSnippetTab === tab
                            ? "bg-black text-white"
                            : "bg-white border border-black/10 text-black/50 hover:text-black"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                    <button
                      onClick={handleCopySnippet}
                      className="ml-2 px-3 py-1 bg-black text-white hover:bg-[#FF4500] font-sans text-[10px] font-bold uppercase flex items-center gap-1 transition-all rounded-sm active:scale-[0.98]"
                    >
                      {snippetCopied ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>{snippetCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <pre className="p-3 bg-black text-white font-mono text-[11px] whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {codeSnippets[activeSnippetTab]}
                </pre>
              </div>
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
                          <span className="font-bold text-black">{pm.model_name}</span>
                          <span className="text-emerald-700 font-bold">{pm.price_paid} CR</span>
                        </div>
                        <span className="text-[9px] text-black/40 mt-1 block">
                          Purchased: {new Date(pm.purchased_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tested Models */}
              <div className="border border-black/10 p-6">
                <h3 className="font-sans font-bold text-xs uppercase text-black tracking-wider mb-4 border-b border-black/10 pb-2">
                  TESTED_MODELS_HISTORY
                </h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {profileData?.tested_models.length === 0 ? (
                    <p className="font-mono text-[10px] text-black/40 uppercase">
                      No models benchmarked in the Arena yet.
                    </p>
                  ) : (
                    profileData?.tested_models.map((tm: any) => (
                      <div key={tm.id} className="p-3 bg-black/[0.01] border border-black/5 font-mono text-[10px]">
                        <span className="font-bold text-black block">{tm.model_name}</span>
                        <div className="flex justify-between items-center mt-1 text-[9px] text-black/50">
                          <span>{tm.test_details}</span>
                          <span>{new Date(tm.tested_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
