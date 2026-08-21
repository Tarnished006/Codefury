"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  handle: string;
  role?: string;
  credits: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  credits: number;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string, handle: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  updateCredits: (delta: number) => void;
  deductCredits: (amount: number) => void;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  fetchBalance: () => Promise<number>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(500);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async (): Promise<number> => {
    const uid = user?.id || "usr_guest_demo";
    try {
      const res = await fetch(`http://localhost:8000/api/wallet/balance/${uid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem("agenthub_token") || localStorage.getItem("agentnet_token");
    if (!savedToken) return;

    try {
      const res = await fetch("http://localhost:8000/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const u: User = {
          id: data.id,
          email: data.email,
          handle: data.handle,
          role: data.role,
          credits: round2(data.credits)
        };
        setUser(u);
        setCredits(round2(data.credits));
        setToken(savedToken);
        localStorage.setItem("agenthub_user", JSON.stringify(u));
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("agenthub_token") || localStorage.getItem("agentnet_token");
      const savedUser = localStorage.getItem("agenthub_user") || localStorage.getItem("agentnet_user");
      
      if (savedToken) {
        setToken(savedToken);
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
        // Automatically provision 1-click guest demo account for judges
        const demoUser: User = {
          id: "usr_guest_demo",
          email: "developer@agenthub.ai",
          handle: "judge_demo",
          role: "consumer",
          credits: 500,
        };
        setUser(demoUser);
        setCredits(500);
      }
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.access_token);
      const u: User = {
        id: data.user.id,
        email: data.user.email,
        handle: data.user.handle,
        role: data.user.role,
        credits: round2(data.user.credits)
      };
      setUser(u);
      setCredits(round2(data.user.credits));
      localStorage.setItem("agenthub_token", data.access_token);
      localStorage.setItem("agenthub_user", JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  };

  const register = async (email: string, pass: string, handle: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, handle })
      });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.access_token);
      const u: User = {
        id: data.user.id,
        email: data.user.email,
        handle: data.user.handle,
        role: data.user.role,
        credits: round2(data.user.credits)
      };
      setUser(u);
      setCredits(round2(data.user.credits));
      localStorage.setItem("agenthub_token", data.access_token);
      localStorage.setItem("agenthub_user", JSON.stringify(u));
      return true;
    } catch {
      return false;
    }
  };

  const loginAsGuest = async (): Promise<void> => {
    try {
      const res = await fetch("http://localhost:8000/api/auth/guest-demo", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        const u: User = {
          id: data.user.id,
          email: data.user.email,
          handle: data.user.handle,
          role: data.user.role,
          credits: round2(data.user.credits)
        };
        setUser(u);
        setCredits(round2(data.user.credits));
        localStorage.setItem("agenthub_token", data.access_token);
        localStorage.setItem("agenthub_user", JSON.stringify(u));
      }
    } catch {
      // fallback
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("agenthub_token");
    localStorage.removeItem("agenthub_user");
    localStorage.removeItem("agentnet_token");
    localStorage.removeItem("agentnet_user");
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
        loginAsGuest,
        logout,
        updateCredits,
        deductCredits,
        setCredits,
        fetchBalance,
        refreshUser,
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