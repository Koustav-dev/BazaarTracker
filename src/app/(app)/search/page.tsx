"use client";
import { StockSearch } from "@/components/stocks/StockSearch";
import { Search, TrendingUp, Zap, BarChart2, Globe } from "lucide-react";
import Link from "next/link";

const POPULAR = [
  "RELIANCE","TCS","HDFCBANK","INFY","TATAMOTORS","ICICIBANK","WIPRO","BAJFINANCE","SBIN","ADANIENT"
];

const FEATURES = [
  { icon: Zap, label: "Fuzzy search", desc: "Typos and partial names still find the right stock" },
  { icon: BarChart2, label: "Sector search", desc: "Type 'Banking' or 'Pharma' to find sector stocks" },
  { icon: Globe, label: "NSE + BSE", desc: "Search across both exchanges simultaneously" },
];

export default function SearchPage() {
  return (
    <div className="page">
      <div className="max-w-2xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
            <Search size={20} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display font-bold text-2xl text-[var(--txt-primary)] mb-2">Search Stocks</h1>
          <p className="text-sm text-[var(--txt-muted)]">Find any NSE or BSE stock by name or symbol</p>
        </div>

        {/* Search — isolated so dropdown doesn't overlap popular chips */}
        <div className="relative z-20 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <StockSearch placeholder="Search — Reliance, TCS, Banking sector…" />
        </div>

        {/* Popular chips */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "120ms" }}>
          <p className="section-title mb-3 flex items-center gap-1.5">
            <TrendingUp size={10} /> Popular
          </p>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map(symbol => (
              <Link key={symbol} href={`/stock/${symbol}?exchange=NSE`}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--txt-secondary)" }}>
                {symbol}
              </Link>
            ))}
          </div>
        </div>

        {/* Feature chips */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
                <Icon size={14} style={{ color: "var(--accent)" }} />
              </div>
              <p className="text-xs font-bold text-[var(--txt-primary)] mb-1">{label}</p>
              <p className="text-xs text-[var(--txt-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
