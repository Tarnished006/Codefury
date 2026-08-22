"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginOAuth } = useAuthContext();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processOAuth = async () => {
      const provider = (searchParams.get("provider") || "google") as "google" | "github";
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDesc = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMessage(errorDesc || error || "OAuth authorization was rejected.");
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMessage("No authorization code was returned by the identity provider.");
        return;
      }

      try {
        const hasProviderParam = searchParams.has("provider");
        const currentRedirectUri = `${window.location.origin}${window.location.pathname}${
          hasProviderParam ? `?provider=${provider}` : ""
        }`;

        const res = await loginOAuth(provider, {
          code,
          redirect_uri: currentRedirectUri,
        });

        if (res.success) {
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/";
          }, 300);
        } else {
          setStatus("error");
          setErrorMessage(res.error || "Failed to finalize OAuth session.");
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "An unexpected error occurred.");
      }
    };

    processOAuth();
  }, [searchParams, loginOAuth]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white">
      <div className="w-full max-w-md border border-black/15 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-black" />
            <div className="font-mono text-xs uppercase tracking-widest text-black/70">
              [ AUTHENTICATING_OAUTH_SESSION ]
            </div>
            <p className="font-mono text-[11px] text-black/40 uppercase">
              Verifying cryptographic handshake with identity provider...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <div className="font-mono text-xs uppercase tracking-widest text-emerald-800 font-bold">
              [ AUTHENTICATION_SUCCESSFUL ]
            </div>
            <p className="font-mono text-[11px] text-black/50 uppercase">
              Redirecting to AgentHub Workspace...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <div className="font-mono text-xs uppercase tracking-widest text-red-600 font-bold">
              [ OAUTH_AUTHENTICATION_FAILED ]
            </div>
            <p className="font-mono text-xs text-black/70 bg-red-50 border border-red-200 p-3 text-left">
              {errorMessage}
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block w-full py-2.5 bg-black text-white text-xs font-mono font-bold uppercase tracking-wider hover:bg-black/90 transition-all"
              >
                Return to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-black flex items-center justify-center font-mono text-xs uppercase tracking-widest">
          [ LOADING_CALLBACK_DISPATCHER ]
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
