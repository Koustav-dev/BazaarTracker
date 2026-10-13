"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { StockDetails } from "@/lib/types";
import { PriceChart } from "@/components/stocks/PriceChart";
import { WatchlistButton } from "@/components/stocks/WatchlistButton";
import { AISummaryPanel } from "@/components/stocks/AISummaryPanel";
import { CreateAlertModal } from "@/components/stocks/CreateAlertModal";
import { NewsWidget } from "@/components/stocks/NewsWidget";
import { formatCurrency, formatCompactNumber, formatPercent, formatVolume, cn } from "@/lib/utils";
import { ArrowLeft, Bell, TrendingDown, TrendingUp, RefreshCw, ExternalLink, Info, Building2, Users, Calendar, Globe, Layers, Tag } from "lucide-react";
import { addRecent } from "@/lib/utils";

function StatCard({ label, value, sub, highlight, tooltip }: {
  label: string; value: string; sub?: string; highlight?: boolean; tooltip?: string;
}) {
  return (
    <div className={cn("group relative p-3.5 rounded-xl border transition-all duration-200 hover:-translate-y-0.5")}
      style={{
        background: highlight ? "color-mix(in srgb, var(--accent) 5%, var(--bg-card))" : "var(--bg-card)",
        border: `1px solid ${highlight ? "color-mix(in srgb, var(--accent) 25%, var(--bg-border))" : "var(--bg-border)"}`,
      }}>
      <div className="flex items-center gap-1 mb-2">
        <p className="stat-label">{label}</p>
        {tooltip && (
          <div className="relative cursor-help">
            <Info size={9} style={{ color: "var(--txt-muted)" }} />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg px-2.5 py-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl leading-relaxed"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-secondary)" }}>
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className="font-mono font-semibold text-sm truncate"
        style={{ color: highlight ? "var(--accent)" : value === "—" ? "var(--txt-muted)" : "var(--txt-primary)" }}>
        {value}
      </p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "var(--txt-muted)" }}>{sub}</p>}
    </div>
  );
}

function AboutPanel({ stock }: { stock: StockDetails }) {
  const [expanded, setExpanded] = useState(false);
  const desc = stock.description ?? "";
  const sentences = desc.match(/[^.!?]+[.!?]+/g) ?? [desc];
  const firstPara = sentences.slice(0, 2).join(" ").trim();
  const restPara  = sentences.slice(2).join(" ").trim();

  const meta = [
    stock.sector    && { icon: Layers,    label: "Sector",     value: stock.sector },
    stock.industry  && { icon: Tag,       label: "Industry",   value: stock.industry },
    stock.employees && { icon: Users,     label: "Employees",  value: stock.employees.toLocaleString("en-IN") },
    stock.ipoDate   && { icon: Calendar,  label: "Listed",     value: new Date(stock.ipoDate).getFullYear().toString() },
    stock.exchange  && { icon: Building2, label: "Exchange",   value: stock.exchange },
    stock.faceValue != null && { icon: Tag, label: "Face Value", value: `₹${stock.faceValue}` },
  ].filter(Boolean) as { icon: React.ElementType; label: string; value: string }[];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--bg-border)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
          <Building2 size={14} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="section-title">About</p>
          <p className="text-xs font-semibold truncate mt-0.5" style={{ color: "var(--txt-primary)" }}>{stock.name}</p>
        </div>
        {stock.website && (
          <a href={stock.website} target="_blank" rel="noopener noreferrer"
            className="btn-ghost text-xs gap-1 shrink-0" style={{ padding: "5px 10px" }}>
            <Globe size={10} /> Website <ExternalLink size={8} />
          </a>
        )}
      </div>
      <div className="p-5 space-y-4">
        {meta.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {meta.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}>
                  <Icon size={11} style={{ color: "var(--accent)" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--txt-muted)" }}>{label}</p>
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--txt-primary)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {firstPara && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed font-medium" style={{ color: "var(--txt-secondary)" }}>{firstPara}</p>
            {restPara && (
              <>
                {expanded && <p className="text-sm leading-relaxed" style={{ color: "var(--txt-muted)" }}>{restPara}</p>}
                <button onClick={() => setExpanded(!expanded)}
                  className="text-xs font-bold transition-colors" style={{ color: "var(--accent)" }}>
                  {expanded ? "Show less ↑" : "Read more ↓"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StockPage() {
  const params   = useParams();
  const sp       = useSearchParams();
  const router   = useRouter();
  const symbol   = (params.symbol as string).toUpperCase();
  const exchange = (sp.get("exchange") ?? "NSE") as "NSE" | "BSE";
  const [alertOpen,  setAlertOpen]  = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  const { data: stock, isLoading, error, refetch, isFetching } = useQuery<StockDetails>({
    queryKey: ["stock-details", symbol, exchange],
    queryFn: () => fetch(`/api/stocks/details?symbol=${symbol}&exchange=${exchange}`)
      .then(r => r.json()).then(j => { if (j.error) throw new Error(j.error); return j.data; }),
    refetchInterval: 60_000, staleTime: 30_000,
  });

  useEffect(() => { if (stock) addRecent(stock.symbol, stock.name, stock.exchange); }, [stock?.symbol]);

  if (isLoading) return (
    <div className="page space-y-4">
      <div className="skeleton h-5 w-24 rounded-lg" />
      <div className="skeleton h-44 w-full rounded-2xl" />
      <div className="skeleton h-72 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 skeleton h-64 rounded-2xl" />
        <div className="lg:col-span-2 skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (error || !stock) return (
    <div className="page">
      <div className="card p-12 text-center">
        <p className="mb-4" style={{ color: "var(--txt-secondary)" }}>Could not load <strong>{symbol}</strong></p>
        <button onClick={() => refetch()} className="btn-primary mx-auto">Retry</button>
      </div>
    </div>
  );

  const isUp  = stock.changePercent >= 0;
  const color = isUp ? "var(--up)" : "var(--down)";
  const pct52 = stock.week52High && stock.week52Low && stock.week52High !== stock.week52Low
    ? Math.max(0, Math.min(100, Math.round((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low) * 100)))
    : null;

  const stats: { label: string; value: string; sub?: string; highlight?: boolean; tooltip?: string }[] = [
    { label: "Volume",     value: stock.volume > 0 ? formatVolume(stock.volume) : "—", sub: stock.volume === 0 ? "Market closed" : undefined },
    { label: "Market Cap", value: stock.marketCap ? formatCompactNumber(stock.marketCap) : "—" },
    { label: "P/E Ratio",  value: stock.peRatio ? stock.peRatio.toFixed(2) : "—", highlight: !!stock.peRatio,
      sub: stock.peRatio ? (stock.peRatio < 12 ? "Cheap" : stock.peRatio < 25 ? "Fair" : stock.peRatio < 40 ? "Pricey" : "Very pricey") : undefined,
      tooltip: "Trailing price-to-earnings ratio" },
    { label: "EPS",        value: stock.eps ? `₹${stock.eps.toFixed(2)}` : "—", sub: "Trailing 12M", tooltip: "Earnings per share, trailing twelve months" },
    { label: "VWAP",       value: stock.vwap ? formatCurrency(stock.vwap) : "—",
      sub: stock.vwap ? (stock.price > stock.vwap ? "Above VWAP ↑" : "Below VWAP ↓") : undefined,
      tooltip: "Volume Weighted Average Price — price paid on average across all trades today (NSE)" },
    { label: "Cap Category", value: stock.marketCapLabel ? stock.marketCapLabel.replace(" CAP","") + " Cap" : "—",
      tooltip: "NSE classification: Large Cap (top 100), Mid Cap (101–250), Small Cap (251+)" },
    { label: "52W High",   value: stock.week52High ? formatCurrency(stock.week52High) : "—",
      sub: stock.week52High && stock.price > stock.week52High * 0.96 ? "Near ATH ↑" : undefined },
    { label: "52W Low",    value: stock.week52Low ? formatCurrency(stock.week52Low) : "—",
      sub: stock.week52Low && stock.price < stock.week52Low * 1.08 ? "Near support ↓" : undefined },
    { label: "P/B Ratio",  value: stock.pbRatio ? stock.pbRatio.toFixed(2) : "—", sub: stock.bookValue ? `BV ₹${stock.bookValue.toFixed(2)}` : undefined, tooltip: "Price-to-book ratio" },
    { label: "Div. Yield", value: stock.dividendYield ? `${stock.dividendYield.toFixed(2)}%` : "—",
      sub: stock.dividendYield ? (stock.dividendYield > 3 ? "High yield" : "Low yield") : undefined,
      tooltip: "Annual dividend ÷ price" },
    { label: "Delivery %", value: stock.deliveryPercent != null ? `${stock.deliveryPercent.toFixed(1)}%` : "—",
      sub: stock.deliveryPercent != null ? (stock.deliveryPercent > 55 ? "Institutional" : stock.deliveryPercent < 25 ? "Speculative" : "Normal") : undefined,
      tooltip: ">50% delivery signals institutional accumulation (NSE data)" },
  ];

  const StatsCard = () => (
    <div className="card p-5 h-full">
      <p className="section-title mb-4">Key Statistics</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {stats.map(s => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} highlight={s.highlight} tooltip={s.tooltip} />
        ))}
      </div>
      <p className="text-[9px] mt-4 pt-3" style={{ borderTop: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
        Prices, PE, EPS, 52W range, market cap: Yahoo Finance · Delivery % and VWAP: NSE (when reachable)
      </p>
    </div>
  );

  const hasAbout = !!(stock.description || stock.sector || stock.employees);

  return (
    <div className="page space-y-4">
      {/* Nav */}
      <div className="flex items-center justify-between animate-fade-in">
        <button onClick={() => router.back()} className="btn-ghost text-xs gap-1.5 pl-0" style={{ color: "var(--txt-muted)" }}>
          <ArrowLeft size={13} /> Back
        </button>
        <button onClick={() => refetch()} className="btn-ghost text-xs gap-1.5" style={{ color: "var(--txt-muted)" }}>
          <RefreshCw size={11} className={isFetching ? "animate-spin" : ""} />
          {isFetching ? "Updating…" : "Refresh"}
        </button>
      </div>

      {/* Hero */}
      <div className="card p-5 animate-fade-up" style={{
        borderColor: isUp ? "color-mix(in srgb, var(--up) 22%, var(--bg-border))" : "color-mix(in srgb, var(--down) 22%, var(--bg-border))"
      }}>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-display font-bold text-2xl" style={{ color: "var(--txt-primary)" }}>{stock.symbol}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
                {stock.exchange}
              </span>
              {stock.sector && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-lg"
                  style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 18%, transparent)" }}>
                  {stock.sector}
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--txt-muted)" }}>{stock.name}</p>
            <div className="flex items-end gap-8 flex-wrap mt-4">
              <div>
                <p className="font-display font-bold text-4xl num-animate" style={{ color: "var(--txt-primary)" }}>
                  {formatCurrency(stock.price)}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 text-sm font-mono font-semibold" style={{ color }}>
                  {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {isUp ? "+" : ""}{formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
                </span>
              </div>
              {pct52 !== null && (
                <div className="mb-1">
                  <p className="text-[9px] font-mono font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--txt-muted)" }}>
                    52-Week Range · {pct52}%
                  </p>
                  <div className="w-44 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct52}%`, background: `linear-gradient(90deg, var(--up), ${color})`, transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] font-mono" style={{ color: "var(--txt-muted)" }}>₹{stock.week52Low?.toLocaleString("en-IN")}</span>
                    <span className="text-[9px] font-mono" style={{ color: "var(--txt-muted)" }}>₹{stock.week52High?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0 self-start">
            <WatchlistButton symbol={stock.symbol} name={stock.name} exchange={exchange} />
            <button onClick={() => setAlertOpen(true)} className="btn-secondary gap-1.5 text-xs">
              <Bell size={12} /> Set Alert
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--bg-border)" }}>
          {[{ l: "Open", v: formatCurrency(stock.open) }, { l: "High", v: formatCurrency(stock.high) }, { l: "Low", v: formatCurrency(stock.low) }, { l: "Prev Close", v: formatCurrency(stock.previousClose) }]
            .map(({ l, v }, i) => (
              <div key={l} className="text-center" style={{ borderRight: i < 3 ? "1px solid var(--bg-border)" : "none" }}>
                <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: "var(--txt-muted)" }}>{l}</p>
                <p className="text-xs font-mono font-semibold mt-0.5" style={{ color: "var(--txt-secondary)" }}>{v}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Chart */}
      <div className="animate-fade-up" style={{ animationDelay: "50ms" }}>
        <PriceChart symbol={symbol} exchange={exchange} changePercent={stock.changePercent} />
      </div>

      {/* ── BENTO GRID ───────────────────────────────────────────────────────── */}
      <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
        {!aiGenerated ? (
          /*
           * DEFAULT LAYOUT (AI not yet generated)
           * Left col: Stats card → About card (fills gap naturally)
           * Right col: AI panel sticky at top — About fills leftover space on left
           */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            <div className="lg:col-span-3 space-y-4">
              <StatsCard />
              {hasAbout && <AboutPanel stock={stock} />}
              <NewsWidget symbol={symbol} name={stock.name} />
            </div>
            <div className="lg:col-span-2 lg:sticky lg:top-20">
              <AISummaryPanel symbol={symbol} exchange={exchange} onAnalysisGenerated={() => setAiGenerated(true)} />
            </div>
          </div>
        ) : (
          /*
           * BENTO LAYOUT (AI generated — panel is now tall)
           * Row 1: Stats (3col) | AI panel (2col) — stretch to same height
           * Row 2: About (3col) | News (2col) — perfect bento second row
           */
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
              <div className="lg:col-span-3"><StatsCard /></div>
              <div className="lg:col-span-2">
                <AISummaryPanel symbol={symbol} exchange={exchange} onAnalysisGenerated={() => setAiGenerated(true)} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
              <div className="lg:col-span-3">{hasAbout && <AboutPanel stock={stock} />}</div>
              <div className="lg:col-span-2"><NewsWidget symbol={symbol} name={stock.name} /></div>
            </div>
          </div>
        )}
      </div>

      {alertOpen && (
        <CreateAlertModal symbol={stock.symbol} name={stock.name} exchange={exchange} currentPrice={stock.price} onClose={() => setAlertOpen(false)} />
      )}
    </div>
  );
}
