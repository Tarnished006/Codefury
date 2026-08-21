"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface User {
  id: string;
  email: string;
  role?: string;
  credits: number;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  credits: number;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  guestLogin: () => void;
  logout: () => void;
  updateCredits: (delta: number) => void;
  deductCredits: (amount: number) => void;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  fetchBalance: () => Promise<number>;
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
      const res = await fetch(`http://localhost:8000/api/wallet/balance/${uid}`);
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
  }, [user, credits]);

  useEffect(() => {
    const savedToken = localStorage.getItem("agenthub_token") || localStorage.getItem("agentnet_token");
    const savedUser = localStorage.getItem("agenthub_user") || localStorage.getItem("agentnet_user");
    
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        setCredits(parsed.credits ?? 500);
      } catch {
        // fallback
      }
    } else {
      const demoUser: User = {
        id: "usr_guest_demo",
        email: "developer@agenthub.ai",
        credits: 500,
      };
      setUser(demoUser);
      setCredits(500);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchBalance();
    }
  }, [loading, fetchBalance]);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      credits: 500,
    };
    setUser(newUser);
    setToken("ak_live_demo_jwt_token");
    setCredits(500);
    localStorage.setItem("agenthub_token", "ak_live_demo_jwt_token");
    localStorage.setItem("agenthub_user", JSON.stringify(newUser));
    return true;
  };

  const guestLogin = () => {
    const demoUser: User = {
      id: "usr_guest_demo",
      email: "developer@agenthub.ai",
      credits: 500,
    };
    setUser(demoUser);
    setToken("ak_live_demo_jwt_token");
    setCredits(500);
    localStorage.setItem("agenthub_token", "ak_live_demo_jwt_token");
    localStorage.setItem("agenthub_user", JSON.stringify(demoUser));
    fetchBalance();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("agenthub_token");
    localStorage.removeItem("agenthub_user");
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
        credits,
        loading,
        login,
        guestLogin,
        logout,
        updateCredits,
        deductCredits,
        setCredits,
        fetchBalance,
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