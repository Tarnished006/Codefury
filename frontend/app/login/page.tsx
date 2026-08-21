"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuthContext();

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
          setError("Invalid email or password.");
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

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <NeuralNavbar />

      <main className="max-w-md w-full mx-auto px-6 pt-28 pb-16">
        <div className="border border-black/10 bg-white p-8">

          {/* ── Brand Title ── */}
          <div className="text-center mb-8">
            <h1 className="font-sans font-extrabold text-2xl text-black tracking-tight mb-1">
              {mode === "login" ? "Sign In to AgentNet" : "Create Developer Account"}
            </h1>
            <p className="text-[10px] font-mono text-black/50 uppercase tracking-widest mt-1">
              Autonomous Intelligence & Economic Mesh
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Credential Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
                  DEVELOPER_HANDLE
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    placeholder="e.g. agent_builder"
                    className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-black/[0.015] text-xs font-mono text-black uppercase tracking-wider outline-none focus:border-black"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="developer@agenthub.ai"
                  className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-black/[0.015] text-xs font-mono text-black tracking-wider outline-none focus:border-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-black/50 font-bold mb-1.5">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 border border-black/15 bg-black/[0.015] text-xs font-mono text-black outline-none focus:border-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-solid-black py-3.5 text-[10px] font-mono font-bold uppercase tracking-widest mt-4 justify-center disabled:opacity-40"
            >
              {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* ── Mode Toggle ── */}
          <div className="text-center mt-8 pt-4 border-t border-black/10 text-xs font-mono text-black/50 uppercase">
            {mode === "login" ? (
              <span>
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-bold text-black hover:text-[#FF4500] underline ml-1"
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
                  className="font-bold text-black hover:text-[#FF4500] underline ml-1"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-black/10 py-5 text-center text-[10px] font-mono text-black/40 uppercase tracking-widest">
        AgentNet // High-Performance AI Infrastructure
      </footer>
    </div>
  );
}