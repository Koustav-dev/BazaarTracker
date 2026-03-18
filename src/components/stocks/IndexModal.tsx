"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Top NSE stocks per index — using free NSE API symbols
// These are the actual Nifty 50 / Sensex / Bank Nifty constituents (current as of 2025)
const INDEX_CONSTITUENTS: Record<string, string[]> = {
  "NIFTY 50": [
    "RELIANCE","TCS","HDFCBANK","BHARTIARTL","ICICIBANK","INFOSYS","SBIN","HINDUNILVR",
    "ITC","LT","BAJFINANCE","HCLTECH","WIPRO","AXISBANK","KOTAKBANK","MARUTI","ASIANPAINT",
    "TITAN","SUNPHARMA","ULTRACEMCO","POWERGRID","NTPC","BAJAJFINSV","NESTLEIND","TECHM",
    "ADANIENT","TATAMOTORS","TATASTEEL","HINDALCO","JSWSTEEL","COALINDIA","ONGC","BPCL",
    "CIPLA","DRREDDY","GRASIM","HEROMOTOCO","INDUSINDBK","M&M","DIVISLAB"
  ],
  "NIFTY BANK": [
    "HDFCBANK","ICICIBANK","SBIN","AXISBANK","KOTAKBANK","INDUSINDBK","BANDHANBNK",
    "FEDERALBNK","IDFCFIRSTB","PNB","BANKBARODA","AUBANK"
  ],
  "SENSEX": [
    "RELIANCE","TCS","HDFCBANK","BHARTIARTL","ICICIBANK","INFOSYS","SBIN","LT",
    "HINDUNILVR","ITC","BAJFINANCE","KOTAKBANK","AXISBANK","MARUTI","ASIANPAINT",
    "TITAN","SUNPHARMA","M&M","BAJAJFINSV","WIPRO","HCLTECH","ULTRACEMCO","NESTLEIND",
    "TECHM","TATAMOTORS","TATASTEEL","NTPC","POWERGRID","INDUSINDBK","ADANIENT"
  ],
};

interface StockRow { symbol: string; price: number; changePercent: number; change: number; name: string; }

interface Props {
  indexName: string;
  indexValue: number;
  indexChange: number;
  indexChangePct: number;
  onClose: () => void;
}

export function IndexModal({ indexName, indexValue, indexChange, indexChangePct, onClose }: Props) {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"change" | "symbol">("change");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const symbols = INDEX_CONSTITUENTS[indexName.toUpperCase()] ??
                  Object.entries(INDEX_CONSTITUENTS).find(([k]) => indexName.toUpperCase().includes(k.split(" ")[1]))?.[1] ??
                  INDEX_CONSTITUENTS["NIFTY 50"];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Fetch quotes in parallel batches (free NSE API — just quote endpoint)
    const topSymbols = symbols.slice(0, 20); // limit to 20 for free tier speed
    Promise.allSettled(
      topSymbols.map(sym =>
        fetch(`/api/stocks/quote?symbol=${sym}&exchange=NSE`)
          .then(r => r.json())
          .then(j => j.data as { symbol: string; price: number; changePercent: number; change: number; name: string } | undefined)
      )
    ).then(results => {
      if (cancelled) return;
      const rows: StockRow[] = results
        .filter(r => r.status === "fulfilled" && r.value)
        .map(r => (r as PromiseFulfilledResult<StockRow>).value)
        .filter(Boolean);
      setStocks(rows);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [indexName]);

  const sorted = [...stocks].sort((a, b) => {
    const val = sortBy === "change" ? b.changePercent - a.changePercent : a.symbol.localeCompare(b.symbol);
    return sortDir === "desc" ? val : -val;
  });

  const isIndexUp = indexChangePct >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col animate-scale-in max-h-[85vh]"
        style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid var(--bg-border)" }}>
          <div>
            <h2 className="font-display font-bold text-lg text-[var(--txt-primary)]">{indexName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono font-bold text-base text-[var(--txt-primary)]">
                {indexValue.toLocaleString("en-IN")}
              </span>
              <span className={cn("flex items-center gap-1 text-sm font-mono font-semibold", isIndexUp ? "text-up" : "text-down")}>
                {isIndexUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isIndexUp ? "+" : ""}{indexChange.toFixed(2)} ({isIndexUp ? "+" : ""}{indexChangePct.toFixed(2)}%)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X size={16} />
          </button>
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--bg-border)" }}>
          <p className="text-[10px] font-semibold text-[var(--txt-muted)] uppercase tracking-wider flex-1">
            Top {Math.min(stocks.length, 20)} constituents
          </p>
          <button onClick={() => { setSortBy("change"); setSortDir(d => sortBy === "change" ? (d === "desc" ? "asc" : "desc") : "desc"); }}
            className={cn("text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all", sortBy === "change" ? "text-[var(--accent)]" : "text-[var(--txt-muted)]")}
            style={{ background: sortBy === "change" ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--bg-elevated)", border: `1px solid ${sortBy === "change" ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--bg-border)"}` }}>
            % Change {sortBy === "change" ? (sortDir === "desc" ? "↓" : "↑") : ""}
          </button>
          <button onClick={() => { setSortBy("symbol"); setSortDir("asc"); }}
            className={cn("text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all", sortBy === "symbol" ? "text-[var(--accent)]" : "text-[var(--txt-muted)]")}
            style={{ background: sortBy === "symbol" ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--bg-elevated)", border: `1px solid ${sortBy === "symbol" ? "color-mix(in srgb, var(--accent) 20%, transparent)" : "var(--bg-border)"}` }}>
            A–Z
          </button>
        </div>

        {/* Stock list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full" style={{ border: "2px solid color-mix(in srgb, var(--accent) 15%, transparent)" }} />
                <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "var(--accent)" }} />
              </div>
              <p className="text-sm text-[var(--txt-muted)]">Fetching live prices…</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center">
              <RefreshCw size={20} style={{ color: "var(--txt-muted)" }} className="mx-auto mb-2" />
              <p className="text-sm text-[var(--txt-muted)]">Could not load prices</p>
            </div>
          ) : (
            sorted.map((s, i) => {
              const up = s.changePercent >= 0;
              return (
                <button key={s.symbol}
                  onClick={() => { router.push(`/stock/${s.symbol}?exchange=NSE`); onClose(); }}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left transition-all group"
                  style={{ animationDelay: `${i * 25}ms`, animation: "fadeUp .3s cubic-bezier(.16,1,.3,1) both" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Rank */}
                  <span className="text-[10px] font-mono text-[var(--txt-muted)] w-5 shrink-0">{i + 1}</span>

                  {/* Symbol + name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[var(--txt-primary)] group-hover:text-[var(--accent)] transition-colors">{s.symbol}</span>
                      <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }} />
                    </div>
                    <span className="text-[10px] text-[var(--txt-muted)] truncate block">{s.name}</span>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-mono font-semibold text-sm text-[var(--txt-primary)]">
                      ₹{s.price.toLocaleString("en-IN")}
                    </p>
                    <span className={cn("text-[10px] font-mono font-semibold", up ? "text-up" : "text-down")}>
                      {up ? "+" : ""}{s.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  {/* Mini change bar */}
                  <div className="w-1 h-8 rounded-full shrink-0" style={{
                    background: `linear-gradient(to bottom, ${up ? "var(--up)" : "var(--down)"}, transparent)`,
                    opacity: 0.5
                  }} />
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 text-center" style={{ borderTop: "1px solid var(--bg-border)" }}>
          <p className="text-[10px] text-[var(--txt-muted)]">Live prices from NSE · Click any stock to view full analysis</p>
        </div>
      </div>
    </div>
  );
}
