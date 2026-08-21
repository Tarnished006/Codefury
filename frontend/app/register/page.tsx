"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { login, guestLogin } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await login(email, password);
    setLoading(false);
    router.push("/");
  };

  const handleGuest = () => {
    guestLogin();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col justify-between p-6">
      {/* Top bar */}
      <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#71717A] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ./return_to_base
        </Link>
        <span className="bracket-label">[ REGISTRATION_PORTAL ]</span>
      </div>

      {/* Center card */}
      <div className="w-full max-w-md mx-auto my-12 border border-[#E4E4E7] bg-white p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="bracket-label text-black">[ NEW_DEVELOPER_ID ]</span>
          <ShieldCheck className="w-4 h-4 text-black" />
        </div>

        <h1 className="font-sans font-black text-2xl text-black tracking-tight mb-1">
          Create Developer ID
        </h1>
        <p className="font-mono text-xs text-[#71717A] mb-8">
          Provision a dedicated wallet loaded with 500 starting test credits.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.65rem] font-mono uppercase tracking-wider text-[#71717A] mb-1.5">
              AGENT_HANDLE
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="agent_01"
              className="w-full border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs font-mono text-black outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-mono uppercase tracking-wider text-[#71717A] mb-1.5">
              DEVELOPER_EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@agentnet.ai"
              className="w-full border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs font-mono text-black outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-mono uppercase tracking-wider text-[#71717A] mb-1.5">
              PASSWORD_OR_KEY
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full border border-[#E4E4E7] bg-[#FAFAFA] px-3.5 py-2.5 text-xs font-mono text-black outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-solid-black flex items-center justify-center gap-2 mt-6"
          >
            <span>{loading ? "PROVISIONING..." : "PROVISION_WALLET (500 CR)"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[#E4E4E7]" />
          <span className="text-[0.6rem] font-mono text-[#A1A1AA] uppercase">OR</span>
          <div className="flex-1 h-[1px] bg-[#E4E4E7]" />
        </div>

        <button
          onClick={handleGuest}
          className="w-full btn-outline flex items-center justify-center gap-2 text-center"
        >
          <span>QUICK DEMO BYPASS</span>
        </button>

        <div className="mt-8 text-center text-[0.68rem] font-mono text-[#71717A]">
          Already registered?{" "}
          <Link href="/login" className="text-black font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] py-4 text-center text-xs font-mono text-[#71717A]">
        agentnet // Decentralized AI Architecture
      </footer>
    </div>
  );
}