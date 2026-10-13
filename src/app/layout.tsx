import React from "react";
import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";

const sora  = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["400","500","600","700","800"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap", weight: ["300","400","500","600"] });

export const metadata: Metadata = {
  title: "Bazaar — Indian Stock Intelligence",
  description: "Real-time NSE & BSE tracking with AI-powered dual-horizon analysis, technical indicators, and smart alerts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "var(--font-body)" }}>
        <Providers>
          {children}
          <Toaster position="bottom-right" toastOptions={{
            style: { background: "var(--bg-card)", color: "var(--txt-primary)", border: "1px solid var(--bg-border)", fontFamily: "var(--font-body)", fontSize: "13px", boxShadow: "0 8px 24px rgba(0,0,0,.2)" },
            success: { iconTheme: { primary: "var(--up)",   secondary: "var(--bg-card)" } },
            error:   { iconTheme: { primary: "var(--down)", secondary: "var(--bg-card)" } },
          }} />
        </Providers>
      </body>
    </html>
  );
}
