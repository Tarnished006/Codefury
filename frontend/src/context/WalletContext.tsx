"use client";
import { useAuthContext } from "@/providers/AuthProvider";

export const useWallet = useAuthContext;
export const WalletContext = useAuthContext;