"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { StockQuote, WatchlistStock } from "@/lib/types";
import { StockCard } from "@/components/stocks/StockCard";
import { BookMarked, ArrowRight, Loader2, Sparkles, Trash2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function WatchlistPage() {
  const qc = useQueryClient();
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const { data: items = [], isLoading: iL } = useQuery<WatchlistStock[]>({
    queryKey: ["watchlist"],
    queryFn: () => fetch("/api/watchlist").then(r => r.json()).then(j => j.data ?? []),
  });

  const { data: quotes = [], isLoading: qL, refetch } = useQuery<StockQuote[]>({
    queryKey: ["wl-full", items.map(w => w.symbol).join(",")],
    queryFn: async () => {
      if (!items.length) return [];
      const results = await Promise.allSettled(
        items.map(w => fetch(`/api/stocks/quote?symbol=${w.symbol}&exchange=${w.exchange}`).then(r => r.json()).then(j => j.data))
      );
      return results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<StockQuote>).value).filter(Boolean);
    },
    enabled: items.length > 0, refetchInterval: 60_000,
  });

  async function remove(symbol: string, exchange: string) {
    setRemoving(symbol);
    try {
      await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, exchange }) });
      qc.invalidateQueries({ queryKey: ["watchlist"] });
      toast.success(`${symbol} removed`);
    } catch { toast.error("Failed"); }
    finally { setRemoving(null); }
  }

  async function genInsight() {
    if (!quotes.length) return;
    setInsightLoading(true); setInsight("");
    try {
      const res = await fetch("/api/ai/insight", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stocks: quotes.map(q => ({ symbol: q.symbol, name: q.name, changePercent: q.changePercent, price: q.price })) }),
      });
      const json = await res.json();
      setInsight(json.data ?? "");
    } catch { toast.error("Failed"); }
    finally { setInsightLoading(false); }
  }

  const loading = iL || qL;
  const gainers  = quotes.filter(q => q.changePercent > 0).length;
  const losers   = quotes.filter(q => q.changePercent < 0).length;
  const avgChg   = quotes.length ? quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length : 0;

  return (
    <div className="space-y-6 page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-txt-primary">Watchlist</h1>
          <p className="text-xs text-txt-muted mt-0.5">{items.length} stocks</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-ghost text-xs gap-1.5 text-txt-muted">
            <RefreshCw size={11} /> Refresh
          </button>
          <Link href="/search" className="btn-primary text-xs px-3 py-2">+ Add</Link>
        </div>
      </div>

      {quotes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="stat-label">Tracked</p>
            <p className="stat-value text-txt-primary">{items.length}</p>
          </div>
          <div className="card p-4">
            <p className="stat-label">Up / Down</p>
            <p className="stat-value"><span className="text-up">{gainers}</span> <span className="text-txt-muted text-sm">/</span> <span className="text-down">{losers}</span></p>
          </div>
          <div className="card p-4">
            <p className="stat-label">Avg Change</p>
            <p className={cn("stat-value", avgChg >= 0 ? "text-up" : "text-down")}>
              {avgChg >= 0 ? "+" : ""}{avgChg.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {quotes.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Sparkles size={13} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-txt-primary">Portfolio Insight</p>
            </div>
            <button onClick={genInsight} disabled={insightLoading}
              className="flex items-center gap-1.5 text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1.5 rounded-xl hover:bg-violet-500/20 transition-colors">
              {insightLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {insight ? "Refresh" : "Generate"}
            </button>
          </div>
          <p className="text-sm text-txt-secondary leading-relaxed">
            {insight || (insightLoading ? "Analysing your portfolio..." : "Generate an AI summary of your watchlist performance today.")}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : quotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((q, i) => (
            <div key={q.symbol} style={{ animation: `fadeUp 0.4s ${i * 60}ms cubic-bezier(.16,1,.3,1) both` }}>
              <StockCard stock={q} actions={
                <button onClick={() => remove(q.symbol, q.exchange)} disabled={removing === q.symbol}
                  className="btn-danger text-xs py-1.5 w-full">
                  {removing === q.symbol ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  Remove
                </button>
              } />
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center border-dashed">
          <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <BookMarked size={22} className="text-accent" />
          </div>
          <h3 className="font-display font-semibold text-txt-primary mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-txt-muted mb-6">Search for stocks and add them to track prices.</p>
          <Link href="/search" className="btn-primary mx-auto">Search Stocks <ArrowRight size={14} /></Link>
        </div>
      )}
    </div>
  );
}
