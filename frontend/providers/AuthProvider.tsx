"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  email: string;
  handle: string;
  role?: string;
  credits: number;
  creator_id?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  credits: number;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, handle: string, role?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCredits: (delta: number) => void;
  deductCredits: (amount: number) => void;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  fetchBalance: () => Promise<number>;
  refreshUser: () => Promise<void>;
  convertToCreator: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setAuthCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `agenthub_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  }
}

function removeAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "agenthub_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "agentnet_token=; path=/; max-age=0; SameSite=Lax";
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(500);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("agenthub_token");
    localStorage.removeItem("agenthub_user");
    localStorage.removeItem("agentnet_token");
    localStorage.removeItem("agentnet_user");
    removeAuthCookie();
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const savedToken =
      localStorage.getItem("agenthub_token") ||
      localStorage.getItem("agentnet_token") ||
      getCookie("agenthub_token");

    if (!savedToken) return;

    try {
      const res = await fetch("http://localhost:8000/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const u: User = {
          id: data.id,
          email: data.email,
          handle: data.handle,
          role: data.role,
          credits: round2(data.credits),
          creator_id: data.creator_id,
        };
        setUser(u);
        setCredits(round2(data.credits));
        setToken(savedToken);
        setAuthCookie(savedToken);
        localStorage.setItem("agenthub_token", savedToken);
        localStorage.setItem("agenthub_user", JSON.stringify(u));
      } else if (res.status === 401 || res.status === 403) {
        logout();
      }
    } catch {
      // Offline fallback
    }
  }, [logout]);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken =
        localStorage.getItem("agenthub_token") ||
        localStorage.getItem("agentnet_token") ||
        getCookie("agenthub_token");

      const savedUser =
        localStorage.getItem("agenthub_user") ||
        localStorage.getItem("agentnet_user");

      if (savedToken) {
        setToken(savedToken);
        setAuthCookie(savedToken);
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setCredits(round2(parsed.credits ?? 500));
          } catch {
            // fallback
          }
        }
        await refreshUser();
      } else {
        removeAuthCookie();
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const fetchBalance = useCallback(async (): Promise<number> => {
    if (!user?.id) return credits;
    try {
      const res = await fetch(`http://localhost:8000/api/wallet/balance/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const bal = typeof data.balance_credits === "number" ? round2(data.balance_credits) : 500;
        setCredits(bal);
        return bal;
      }
    } catch {
      // ignore
    }
    return credits;
  }, [user, token, credits]);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || "Invalid email or password." };
      }
      const data = await res.json();
      setToken(data.access_token);
      setAuthCookie(data.access_token);
      const u: User = {
        id: data.user.id,
        email: data.user.email,
        handle: data.user.handle,
        role: data.user.role,
        credits: round2(data.user.credits),
        creator_id: data.user.creator_id,
      };
      setUser(u);
      setCredits(round2(data.user.credits));
      localStorage.setItem("agenthub_token", data.access_token);
      localStorage.setItem("agenthub_user", JSON.stringify(u));
      return { success: true };
    } catch {
      return { success: false, error: "API connection failed. Verify backend is running." };
    }
  };

  const register = async (email: string, pass: string, handle: string, role: string = "developer"): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, handle, role }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || "Registration failed." };
      }
      const data = await res.json();
      setToken(data.access_token);
      setAuthCookie(data.access_token);
      const u: User = {
        id: data.user.id,
        email: data.user.email,
        handle: data.user.handle,
        role: data.user.role,
        credits: round2(data.user.credits),
        creator_id: data.user.creator_id,
      };
      setUser(u);
      setCredits(round2(data.user.credits));
      localStorage.setItem("agenthub_token", data.access_token);
      localStorage.setItem("agenthub_user", JSON.stringify(u));
      return { success: true };
    } catch {
      return { success: false, error: "API connection failed. Verify backend is running." };
    }
  };

  const convertToCreator = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const savedToken = token || localStorage.getItem("agenthub_token") || localStorage.getItem("agentnet_token");
      if (!savedToken) return { success: false, error: "No active session found." };

      const res = await fetch("http://localhost:8000/api/auth/convert-to-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || "Conversion to Creator failed." };
      }
      const data = await res.json();
      const u: User = {
        id: data.id,
        email: data.email,
        handle: data.handle,
        role: data.role,
        credits: round2(data.credits),
        creator_id: data.creator_id,
      };
      setUser(u);
      setCredits(round2(data.credits));
      localStorage.setItem("agenthub_user", JSON.stringify(u));
      return { success: true };
    } catch {
      return { success: false, error: "API connection failed. Verify backend is running." };
    }
  };

  const updateCredits = (delta: number) => {
    setCredits((prev) => {
      const next = Math.max(0, round2(prev + delta));
      if (user) {
        const updated = { ...user, credits: next };
        setUser(updated);
        localStorage.setItem("agenthub_user", JSON.stringify(updated));
      }
      return next;
    });
  };

  const deductCredits = (amount: number) => {
    updateCredits(-amount);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        credits,
        loading,
        login,
        register,
        logout,
        updateCredits,
        deductCredits,
        setCredits,
        fetchBalance,
        refreshUser,
        convertToCreator,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}