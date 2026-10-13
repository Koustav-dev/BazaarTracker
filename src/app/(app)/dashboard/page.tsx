"use client";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StockCard } from "@/components/stocks/StockCard";
import { MarketIndex, StockQuote, WatchlistStock } from "@/lib/types";
import { getISTDate, isMarketOpen, cn, formatPercent } from "@/lib/utils";
import { Bell, BookMarked, TrendingDown, TrendingUp, ArrowRight, RefreshCw, Activity, Clock, ChevronRight } from "lucide-react";
import { IndexModal } from "@/components/stocks/IndexModal";

// ── Recently viewed — stored in localStorage ─────────────────────────────────
interface RecentStock { symbol: string; name: string; exchange: string; ts: number; }

function getRecents(): RecentStock[] {
  try { return JSON.parse(localStorage.getItem("bazaar_recents") ?? "[]"); } catch { return []; }
}

function IndexCard({ idx, delay, onSelect }: { idx: MarketIndex; delay: string; onSelect: (idx: MarketIndex) => void }) {
  const up = idx.changePercent >= 0;
  return (
    <div className={cn("card-hover p-4")}
      onClick={() => onSelect(idx)}
      style={{ animationDelay: delay, animation: "fadeUp .4s cubic-bezier(.16,1,.3,1) both" }}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-[var(--txt-muted)] truncate pr-2">{idx.name}</p>
        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0", up ? "badge-up" : "badge-down")}>
          {up ? "▲" : "▼"}{Math.abs(idx.changePercent).toFixed(2)}%
        </span>
      </div>
      <p className="font-display font-bold text-xl text-[var(--txt-primary)]">{idx.value.toLocaleString("en-IN")}</p>
      <p className={cn("text-xs font-mono mt-1", up ? "text-up" : "text-down")}>
        {up ? "+" : ""}{idx.change.toFixed(2)} today
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Investor";
  const open = isMarketOpen();
  const [recents, setRecents] = useState<RecentStock[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<MarketIndex | null>(null);

  useEffect(() => { setRecents(getRecents()); }, []);

  const { data: indices = [], isLoading: idxLoading, refetch: refetchIdx, isFetching: idxFetching } = useQuery<MarketIndex[]>({
    queryKey: ["indices"],
    queryFn: () => fetch("/api/stocks/indices").then(r => r.json()).then(j => j.data ?? []),
    refetchInterval: 60_000, staleTime: 30_000,
  });

  const { data: watchlistItems = [] } = useQuery<WatchlistStock[]>({
    queryKey: ["watchlist"],
    queryFn: () => fetch("/api/watchlist").then(r => r.json()).then(j => j.data ?? []),
  });

  const { data: quotes = [], isLoading: qLoading } = useQuery<StockQuote[]>({
    queryKey: ["wl-quotes", watchlistItems.map(w => w.symbol).join(",")],
    queryFn: async () => {
      if (!watchlistItems.length) return [];
      const results = await Promise.allSettled(
        watchlistItems.slice(0, 6).map(w =>
          fetch(`/api/stocks/quote?symbol=${w.symbol}&exchange=${w.exchange}`).then(r => r.json()).then(j => j.data)
        )
      );
      return results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<StockQuote>).value).filter(Boolean);
    },
    enabled: watchlistItems.length > 0, staleTime: 30_000,
  });

  const gainers = [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, 4);
  const losers  = [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, 4);
  const avgChange = quotes.length ? quotes.reduce((s, q) => s + q.changePercent, 0) / quotes.length : 0;

  return (
    <div className="space-y-6 page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--txt-primary)]">
            {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, {firstName}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-[var(--txt-muted)]">{getISTDate()}</span>
            <span className="text-[var(--txt-muted)]">·</span>
            <span className={cn("text-xs font-medium flex items-center gap-1.5", open ? "text-up" : "text-[var(--txt-muted)]")}>
              {open && <span className="live-dot" />}
              Market {open ? "Open" : "Closed"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetchIdx()} className="btn-ghost text-xs gap-1.5">
            <RefreshCw size={12} className={idxFetching ? "animate-spin" : ""} /> Refresh
          </button>
          <Link href="/search" className="btn-primary text-xs px-4 py-2">+ Add Stock</Link>
        </div>
      </div>

      {/* Summary pills */}
      {quotes.length > 0 && (
        <div className="flex items-center gap-2.5 flex-wrap animate-fade-up" style={{ animationDelay: "40ms" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}>
            <BookMarked size={12} style={{ color: "var(--accent)" }} />
            <span className="text-xs font-medium text-[var(--txt-secondary)]">{watchlistItems.length} tracked</span>
          </div>
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl")} style={{ background: "var(--bg-card)", border: `1px solid ${avgChange >= 0 ? "rgba(5,150,105,.25)" : "rgba(220,38,38,.25)"}` }}>
            <Activity size={12} style={{ color: avgChange >= 0 ? "var(--up)" : "var(--down)" }} />
            <span className="text-xs font-mono font-medium" style={{ color: avgChange >= 0 ? "var(--up)" : "var(--down)" }}>
              Avg {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(5,150,105,.06)", border: "1px solid rgba(5,150,105,.2)" }}>
            <TrendingUp size={12} className="text-up" />
            <span className="text-xs font-medium text-up">{gainers.filter(g => g.changePercent > 0).length} up</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.2)" }}>
            <TrendingDown size={12} className="text-down" />
            <span className="text-xs font-medium text-down">{losers.filter(l => l.changePercent < 0).length} down</span>
          </div>
        </div>
      )}

      {/* Market overview */}
      <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
        <p className="section-title mb-3">Market Overview</p>
        {idxLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {indices.map((idx: MarketIndex, i: number) => <IndexCard key={idx.name} idx={idx} delay={`${i * 80}ms`} onSelect={setSelectedIndex} />)}
          </div>
        )}
      </section>

      {/* Recently viewed */}
      {recents.length > 0 && (
        <section className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={12} style={{ color: "var(--txt-muted)" }} />
            <p className="section-title">Recently Viewed</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recents.slice(0, 8).map(r => (
              <button key={r.symbol}
                onClick={() => router.push(`/stock/${r.symbol}?exchange=${r.exchange}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", color: "var(--txt-secondary)" }}>
                <span className="font-mono font-semibold text-[var(--txt-primary)] text-xs">{r.symbol}</span>
                <span className="text-[10px] text-[var(--txt-muted)] max-w-[80px] truncate hidden sm:block">{r.exchange}</span>
                <ChevronRight size={10} style={{ color: "var(--txt-muted)" }} />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Watchlist */}
      {watchlistItems.length > 0 && (
        <section className="animate-fade-up" style={{ animationDelay: "160ms" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">Watchlist</p>
            <Link href="/watchlist" className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80" style={{ color: "var(--accent)" }}>
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {qLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quotes.map((q, i) => (
                <div key={q.symbol} style={{ animation: `fadeUp .4s ${i * 60}ms cubic-bezier(.16,1,.3,1) both` }}>
                  <StockCard stock={q} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {watchlistItems.length === 0 && (
        <div className="card p-14 text-center" style={{ border: "1.5px dashed var(--bg-border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
            <BookMarked size={22} style={{ color: "var(--accent)" }} />
          </div>
          <h3 className="font-display font-semibold text-[var(--txt-primary)] mb-2">Build your watchlist</h3>
          <p className="text-sm text-[var(--txt-muted)] mb-6">Search any NSE or BSE stock to start tracking it.</p>
          <Link href="/search" className="btn-primary mx-auto">
            Search Stocks <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Gainers & Losers */}
      {quotes.length >= 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {[
            { title: "Top Gainers", icon: TrendingUp,  data: gainers.filter(g => g.changePercent > 0), accentColor: "var(--up)",   borderColor: "rgba(5,150,105,.2)", bgColor: "rgba(5,150,105,.04)" },
            { title: "Top Losers",  icon: TrendingDown, data: losers.filter(l => l.changePercent < 0),  accentColor: "var(--down)", borderColor: "rgba(220,38,38,.2)",  bgColor: "rgba(220,38,38,.04)" },
          ].map(({ title, icon: Icon, data, accentColor, borderColor, bgColor }) => data.length > 0 && (
            <div key={title} className="card p-4" style={{ borderColor, background: bgColor }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={13} style={{ color: accentColor }} />
                <p className="section-title">{title}</p>
              </div>
              <div className="space-y-1">
                {data.map(s => (
                  <button key={s.symbol} onClick={() => router.push(`/stock/${s.symbol}?exchange=${s.exchange}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl transition-all hover:shadow-sm"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-card)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div className="text-left">
                      <p className="text-sm font-semibold font-mono text-[var(--txt-primary)]">{s.symbol}</p>
                      <p className="text-xs text-[var(--txt-muted)]">₹{s.price.toLocaleString("en-IN")}</p>
                    </div>
                    <span className={s.changePercent >= 0 ? "badge-up" : "badge-down"}>
                      {formatPercent(s.changePercent)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Index Modal */}
      {selectedIndex && (
        <IndexModal
          indexName={selectedIndex.name}
          indexValue={selectedIndex.value}
          indexChange={selectedIndex.change}
          indexChangePct={selectedIndex.changePercent}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}