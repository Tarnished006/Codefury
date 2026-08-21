"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(500);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved session or initialize default guest
    const savedToken = localStorage.getItem("agentnet_token");
    const savedUser = localStorage.getItem("agentnet_user");
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
      // Default demo state: 500 credits preloaded
      const demoUser: User = {
        id: "usr_guest_demo",
        email: "demo@agentnet.ai",
        credits: 500,
      };
      setUser(demoUser);
      setCredits(500);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, _pass: string): Promise<boolean> => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email,
      credits: 500,
    };
    setUser(newUser);
    setToken("ak_live_demo_jwt_token");
    setCredits(500);
    localStorage.setItem("agentnet_token", "ak_live_demo_jwt_token");
    localStorage.setItem("agentnet_user", JSON.stringify(newUser));
    return true;
  };

  const guestLogin = () => {
    const demoUser: User = {
      id: "usr_guest_demo",
      email: "demo@agentnet.ai",
      credits: 500,
    };
    setUser(demoUser);
    setToken("ak_live_demo_jwt_token");
    setCredits(500);
    localStorage.setItem("agentnet_token", "ak_live_demo_jwt_token");
    localStorage.setItem("agentnet_user", JSON.stringify(demoUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("agentnet_token");
    localStorage.removeItem("agentnet_user");
  };

  const updateCredits = (delta: number) => {
    setCredits((prev) => {
      const next = Math.max(0, prev + delta);
      if (user) {
        const updated = { ...user, credits: next };
        setUser(updated);
        localStorage.setItem("agentnet_user", JSON.stringify(updated));
      }
      return next;
    });
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}