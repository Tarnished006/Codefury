"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import NeuralNavbar from "@/components/NeuralNavbar";
import { useAuthContext } from "@/providers/AuthProvider";
import OAuthButtons from "@/components/OAuthButtons";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuthContext();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("developer@agenthub.ai");
  const [password, setPassword] = useState("demo_password_123");
  const [handle, setHandle] = useState("agenthub_dev");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (res.success) {
          router.push(redirectUrl);
        } else {
          setError(res.error || "Invalid email or password.");
        }
      } else {
        const res = await register(email, password, handle);
        if (res.success) {
          router.push(redirectUrl);
        } else {
          setError(res.error || "Registration failed. Handle or email might already be registered.");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-black/15 bg-white p-8 sm:p-10 shadow-sm rounded-lg">
      {/* ── Brand Title ── */}
      <div className="text-center mb-8">
        <h1 className="font-sans font-extrabold text-3xl text-black tracking-tight mb-2">
          {mode === "login" ? "Sign In to AgentNet" : "Create Developer Account"}
        </h1>
        <p className="text-xs font-mono text-black/60 uppercase tracking-wider mt-1">
          Autonomous Intelligence & Economic Mesh
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm font-mono flex items-center gap-2.5 rounded">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Social OAuth Handshake ── */}
      <div className="mb-8">
        <OAuthButtons
          redirectUrl={redirectUrl}
          onError={(err) => setError(err)}
          onStart={() => setError(null)}
        />

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <span className="relative bg-white px-3.5 text-xs font-mono uppercase text-black/50 tracking-wider">
            OR CONTINUE WITH EMAIL
          </span>
        </div>
      </div>

      {/* ── Credential Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "register" && (
          <div>
            <label className="block text-xs font-mono uppercase text-black/70 font-semibold mb-1.5">
              DEVELOPER_HANDLE
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                required
                placeholder="e.g. agent_builder"
                className="w-full pl-10 pr-4 py-3 border border-black/20 bg-black/[0.015] text-sm font-mono text-black tracking-wider outline-none focus:border-black rounded-md transition-all"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase text-black/70 font-semibold mb-1.5">
            EMAIL_ADDRESS
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="developer@agenthub.ai"
              className="w-full pl-10 pr-4 py-3 border border-black/20 bg-black/[0.015] text-sm font-mono text-black tracking-wider outline-none focus:border-black rounded-md transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase text-black/70 font-semibold mb-1.5">
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-3 border border-black/20 bg-black/[0.015] text-sm font-mono text-black tracking-wider outline-none focus:border-black rounded-md transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-solid-black w-full py-3.5 text-sm font-semibold tracking-wide flex items-center justify-center gap-2 rounded-md shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <span className="font-mono text-xs uppercase tracking-widest">[ AUTHENTICATING... ]</span>
          ) : (
            <>
              <span>{mode === "login" ? "SIGN IN TO DASHBOARD" : "INITIALIZE ACCOUNT"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
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
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between">
      <NeuralNavbar />

      <main className="max-w-md w-full mx-auto px-6 pt-28 pb-16">
        <Suspense fallback={
          <div className="p-8 border border-black/10 text-center font-mono text-xs text-black/40">
            [ INITIALIZING_AUTH_GATEWAY ]
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>

      <footer className="border-t border-black/10 py-5 text-center text-[10px] font-mono text-black/40 uppercase tracking-widest">
        AgentNet // High-Performance AI Infrastructure
      </footer>
    </div>
  );
}