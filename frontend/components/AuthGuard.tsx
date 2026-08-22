"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuthContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!isAuthenticated && !isPublicPath) {
      const redirectParam = pathname !== "/" ? `?redirect=${encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""))}` : "";
      router.replace(`/login${redirectParam}`);
    } else if (isAuthenticated && isPublicPath) {
      const target = searchParams.get("redirect") || "/";
      router.replace(target);
    }
  }, [isAuthenticated, loading, isPublicPath, pathname, router, searchParams, mounted]);

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

  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-xs text-black/60 uppercase tracking-widest">
          [ REDIRECTING_TO_AUTHENTICATION ]
        </span>
      </div>
    );
  }

  if (isAuthenticated && isPublicPath) {
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
