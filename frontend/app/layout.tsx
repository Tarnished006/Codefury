import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import AuthGuard from "@/components/AuthGuard";
import AIChatbot from "@/components/AIChatbot";
import { Suspense } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://agenthub.ai"),
  title: "AgentNet — The Global Standard for Autonomous Intelligence",
  description:
    "Deploy, benchmark, and scale open-weight Hugging Face models across high-throughput GPU clusters with autonomous Meta-Agent routing and OWASP security audits.",
  keywords: ["AgentNet", "AgentHub", "AI marketplace", "Hugging Face", "LLM deployment", "Meta-Agent", "OWASP AI security", "MCP"],
  authors: [{ name: "AgentNet Engineering Team" }],
  creator: "AgentNet",
  openGraph: {
    title: "AgentNet — The Global Standard for Autonomous Intelligence",
    description: "Deploy, benchmark, and scale open-weight Hugging Face models across high-throughput GPU clusters.",
    url: "https://agenthub.ai",
    siteName: "AgentNet",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white text-black min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <AuthGuard>
                {children}
                <AIChatbot />
              </AuthGuard>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}