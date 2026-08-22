"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";

const PROTECTED_PATHS = ["/profile", "/wallet"];
const AUTH_ONLY_PATHS = ["/login", "/register", "/auth/callback"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthOnlyPath = AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (!mounted || loading) return;

    if (!isAuthenticated && isProtectedPath) {
      const redirectParam = `?redirect=${encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""))}`;
      router.replace(`/login${redirectParam}`);
    } else if (isAuthenticated && isAuthOnlyPath) {
      const target = searchParams.get("redirect") || "/";
      router.replace(target);
    }
  }, [isAuthenticated, loading, isProtectedPath, isAuthOnlyPath, pathname, router, searchParams, mounted]);

  if (!mounted || loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-sans font-extrabold text-2xl tracking-tighter text-black">
            agentnet
          </span>
          <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-ping" />
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-black/50 uppercase tracking-widest">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
          <span>[ VERIFYING_NEURAL_CREDENTIALS ]</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && isProtectedPath) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-black/60 uppercase tracking-widest">
          [ REDIRECTING_TO_AUTHENTICATION ]
        </span>
      </div>
    );
  }

  if (isAuthenticated && isAuthOnlyPath) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-black/60 uppercase tracking-widest">
          [ ACCESS_GRANTED // ENTERING_MESH ]
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
