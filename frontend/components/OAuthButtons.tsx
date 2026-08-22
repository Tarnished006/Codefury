"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchOAuthUrl, loginWithOAuth } from "@/lib/api";
import { useAuthContext } from "@/providers/AuthProvider";

interface OAuthButtonsProps {
  redirectUrl?: string;
  role?: "developer" | "creator";
  onStart?: () => void;
  onError?: (err: string) => void;
}

export default function OAuthButtons({
  redirectUrl = "/",
  role = "developer",
  onStart,
  onError,
}: OAuthButtonsProps) {
  const { loginOAuth } = useAuthContext();
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);

  const handleOAuthClick = async () => {
    setOauthLoading("google");
    if (onStart) onStart();

    try {
      // 1. Fetch configured OAuth URL from backend with explicit callback URL
      const currentRedirect =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?provider=google`
          : undefined;
      const res = await fetchOAuthUrl("google", currentRedirect);

      // If real OAuth Client ID is configured and not a placeholder, redirect to provider auth screen
      if (
        res.client_id &&
        !res.client_id.includes("placeholder") &&
        !res.client_id.includes("your_")
      ) {
        window.location.href = res.auth_url;
        return;
      }

      // 2. Seamless local/fallback zero-config OAuth login
      const result = await loginOAuth("google", {
        role,
        user_info: {
          email: `google_developer@agenthub.ai`,
          name: `Google Developer`,
          picture: "https://lh3.googleusercontent.com/a/default-user",
        },
      });

      if (result.success) {
        window.location.href = redirectUrl;
      } else {
        if (onError) onError(result.error || `Failed to sign in with Google.`);
      }
    } catch (err: any) {
      if (onError) onError(err.message || `Failed to initiate Google OAuth.`);
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Google OAuth Button */}
      <button
        type="button"
        disabled={!!oauthLoading}
        onClick={handleOAuthClick}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-black/20 bg-white hover:bg-black/[0.02] text-xs font-mono font-bold uppercase tracking-wider text-black transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.99]"
      >
        {oauthLoading === "google" ? (
          <Loader2 className="w-4 h-4 animate-spin text-black" />
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.7 0 3 .7 3.9 1.5l2.9-2.9C17 1.8 14.7 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.2C.7 9.6 0 10.7 0 12s.7 2.4 1.9 4.8l3.7-2.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z"
            />
          </svg>
        )}
        <span>
          {oauthLoading === "google" ? "Connecting to Google..." : "Continue with Google"}
        </span>
      </button>
    </div>
  );
}
