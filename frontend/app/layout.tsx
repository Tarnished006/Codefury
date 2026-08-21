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
  metadataBase: new URL("https://agentnet.ai"),
  title: "agentnet — The Global Standard for Autonomous Intelligence",
  description:
    "Deploy, monetize, and scale autonomous AI agents on a high-performance liquidity layer.",
  keywords: ["agentnet", "AI marketplace", "Hugging Face", "model deployment", "autonomous intelligence"],
  authors: [{ name: "agentnet Team" }],
  creator: "agentnet",
  openGraph: {
    title: "agentnet — The Global Standard for Autonomous Intelligence",
    description: "Deploy, monetize, and scale autonomous AI agents on a high-performance liquidity layer.",
    url: "https://agentnet.ai",
    siteName: "agentnet",
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