import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://neuralbazaar.ai"),
  title: "NeuralBazaar — AI Model Marketplace & Autonomous Orchestration Mesh",
  description:
    "Discover, benchmark, and deploy open-weight Hugging Face models across high-throughput GPU clusters with autonomous Meta-Agent routing and OWASP security audits.",
  keywords: ["NeuralBazaar", "AI marketplace", "Hugging Face", "LLM deployment", "Meta-Agent", "OWASP AI security"],
  authors: [{ name: "NeuralBazaar Engineering Team" }],
  creator: "NeuralBazaar",
  openGraph: {
    title: "NeuralBazaar — AI Model Marketplace & Autonomous Orchestration Mesh",
    description: "Discover, benchmark, and deploy open-weight Hugging Face models with autonomous Meta-Agent routing.",
    url: "https://neuralbazaar.ai",
    siteName: "NeuralBazaar",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-black min-h-screen`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}