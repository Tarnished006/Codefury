"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loginAsGuest, isAuthenticated, user } = useAuthContext();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("developer@agenthub.ai");
  const [password, setPassword] = useState("demo_password_123");
  const [handle, setHandle] = useState("agenthub_dev");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const ok = await login(email, password);
        if (ok) {
          router.push("/");
        } else {
          setError("Invalid email or password. You can also use the 1-Click Guest Demo below.");
        }
      } else {
        const ok = await register(email, password, handle);
        if (ok) {
          router.push("/");
        } else {
          setError("Registration failed. Handle or email might already be registered.");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = async () => {
    setLoading(true);
    try {
      await loginAsGuest();
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <NeuralNavbar />

      <main className="max-w-md w-full mx-auto px-4 pt-28 pb-16">
        <div className="border border-[#E2E8F0] bg-white rounded-xl p-8 shadow-sm">

          {/* ── Brand Title ── */}
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-lg bg-black text-white flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="font-sans font-black text-2xl text-black tracking-tight">
              {mode === "login" ? "Sign In to AgentHub" : "Create Developer Account"}
            </h1>
            <p className="text-xs font-mono text-[#64748B] mt-1">
              Autonomous Model Network & Economic Mesh
            </p>
          </div>

          {/* ── Prominent 1-Click Instant Guest Demo Button for Judges ── */}
          <div className="mb-6 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.68rem] font-mono text-[#64748B] uppercase font-bold">
                JUDGES // INSTANT ACCESS
              </span>
              <span className="text-[0.62rem] font-mono text-[#10B981] font-bold">
                +500 CREDITS
              </span>
            </div>
            <button
              onClick={handleGuestDemo}
              disabled={loading}
              className="w-full bg-black text-white hover:bg-zinc-800 transition-colors py-2.5 px-4 rounded-md text-xs font-sans font-bold flex items-center justify-center gap-2 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>⚡ 1-Click Instant Guest Demo</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink mx-3 text-[0.65rem] font-mono text-[#94A3B8] uppercase">
              Or continue with credentials
            </span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Credential Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-mono uppercase text-[#64748B] mb-1">
                  DEVELOPER_HANDLE
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    placeholder="e.g. agent_builder"
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] bg-[#F8FAFC] rounded-md text-xs font-mono text-black outline-none focus:border-black"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-[#64748B] mb-1">
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="developer@agenthub.ai"
                  className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] bg-[#F8FAFC] rounded-md text-xs font-mono text-black outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#64748B] mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] bg-[#F8FAFC] rounded-md text-xs font-mono text-black outline-none focus:border-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-outline py-2 text-xs font-semibold mt-2 justify-center"
            >
              {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* ── Mode Toggle ── */}
          <div className="text-center mt-6 pt-4 border-t border-[#F1F5F9] text-xs font-sans text-[#64748B]">
            {mode === "login" ? (
              <span>
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-bold text-black hover:underline"
                >
                  Register
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-bold text-black hover:underline"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}