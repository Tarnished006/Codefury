"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/providers/AuthProvider";
import { ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import OAuthButtons from "@/components/OAuthButtons";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"developer" | "creator">("developer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUrl = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return;
    setLoading(true);
    setError(null);
    try {
      const res = await register(email, password, username, role);
      if (res.success) {
        router.push(redirectUrl);
      } else {
        setError(res.error || "Registration failed. Handle or email might already be registered.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-black/10 bg-white p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="font-sans font-extrabold text-xl tracking-tighter text-black">
            agentnet
          </span>
        </div>
        <ShieldCheck className="w-5 h-5 text-[#10B981]" />
      </div>

      <h1 className="font-sans font-extrabold text-2xl text-black tracking-tight mb-1">
        Create Account
      </h1>
      <p className="font-mono text-xs text-black/50 uppercase mb-6">
        500 inference test credits provisioned automatically upon registration.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-xs font-mono text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Social OAuth Handshake ── */}
      <div className="mb-6">
        <OAuthButtons
          redirectUrl={redirectUrl}
          role={role}
          onError={(err) => setError(err)}
          onStart={() => setError(null)}
        />

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <span className="relative bg-white px-3 text-[10px] font-mono uppercase text-black/40 tracking-wider">
            OR REGISTER WITH EMAIL
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
            ACCOUNT_ROLE
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/[0.03] border border-black/10 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => setRole("developer")}
              className={`py-2 text-center uppercase tracking-wider font-bold transition-all ${
                role === "developer" ? "bg-black text-white" : "text-black/50 hover:text-black"
              }`}
            >
              Developer / Consumer
            </button>
            <button
              type="button"
              onClick={() => setRole("creator")}
              className={`py-2 text-center uppercase tracking-wider font-bold transition-all ${
                role === "creator" ? "bg-black text-white" : "text-black/50 hover:text-black"
              }`}
            >
              Model Creator
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
            DEVELOPER_HANDLE
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="developer_01"
            className="w-full border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black uppercase tracking-wider"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
            WORK_EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black tracking-wider"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full border border-black/15 bg-black/[0.015] p-3 text-xs font-mono text-black outline-none focus:border-black"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-solid-black gap-2 mt-6 py-3.5 text-[10px] disabled:opacity-40"
        >
          <span>{loading ? "Creating Account..." : "Create Account (500 Credits)"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-8 text-center text-xs font-mono text-black/50 uppercase">
        Already have an account?{" "}
        <Link href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} className="text-black font-bold underline hover:text-[#FF4500]">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <NeuralNavbar />

      <main className="max-w-md w-full mx-auto px-6 pt-28 pb-16">
        <Suspense fallback={
          <div className="p-8 border border-black/10 text-center font-mono text-xs text-black/40">
            [ INITIALIZING_REGISTRATION_GATEWAY ]
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </main>

      <footer className="border-t border-black/10 py-5 text-center text-[10px] font-mono text-black/40 uppercase tracking-widest">
        AgentNet // Autonomous Intelligence Protocol
      </footer>
    </div>
  );
}