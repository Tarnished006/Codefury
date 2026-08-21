"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/providers/AuthProvider";
import { ArrowLeft, ArrowRight, ShieldCheck, Zap } from "lucide-react";

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
          className="inline-flex items-center gap-2 text-xs font-sans font-medium text-[#71717A] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </Link>
        <span className="font-mono text-xs text-[#71717A]">// Registration</span>
      </div>

      {/* Center card */}
      <div className="w-full max-w-md mx-auto my-12 border border-[#E4E4E7] rounded-lg bg-white p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-black flex items-center justify-center text-white">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="font-sans font-bold text-sm text-black">NeuralBazaar</span>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
        </div>

        <h1 className="font-sans font-bold text-2xl text-black tracking-tight mb-1">
          Create Developer Account
        </h1>
        <p className="font-sans text-xs text-[#71717A] mb-8">
          Get started with 500 free inference test credits provisioned automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sans font-medium text-[#71717A] mb-1.5">
              Developer Handle
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="developer_01"
              className="w-full border border-[#E4E4E7] bg-[#FAFAFA] rounded px-3.5 py-2.5 text-sm font-sans text-black outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium text-[#71717A] mb-1.5">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full border border-[#E4E4E7] bg-[#FAFAFA] rounded px-3.5 py-2.5 text-sm font-sans text-black outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-medium text-[#71717A] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full border border-[#E4E4E7] bg-[#FAFAFA] rounded px-3.5 py-2.5 text-sm font-sans text-black outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-solid-black gap-2 mt-6"
          >
            <span>{loading ? "Creating Account..." : "Create Account (500 Credits)"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-[1px] bg-[#E4E4E7]" />
          <span className="text-xs font-mono text-[#A1A1AA]">OR</span>
          <div className="flex-1 h-[1px] bg-[#E4E4E7]" />
        </div>

        <button
          onClick={handleGuest}
          className="w-full btn-outline text-center"
        >
          <span>Continue with Demo Session</span>
        </button>

        <div className="mt-8 text-center text-xs font-sans text-[#71717A]">
          Already have an account?{" "}
          <Link href="/login" className="text-black font-semibold underline">
            Sign In
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] py-4 text-center text-xs font-mono text-[#71717A]">
        NeuralBazaar // High-Performance AI Infrastructure
      </footer>
    </div>
  );
}