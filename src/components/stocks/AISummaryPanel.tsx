"use client";
import React from "react";
import { useState } from "react";
import { AISummary } from "@/lib/types";
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, Target, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const SENTIMENT_CFG = {
  bullish: { icon: TrendingUp,   label: "Bullish",  textColor: "text-up",   bgColor: "bg-[rgba(5,150,105,.1)]",  borderColor: "border-[rgba(5,150,105,.25)]",  dot: "bg-up" },
  bearish: { icon: TrendingDown, label: "Bearish",  textColor: "text-down", bgColor: "bg-[rgba(220,38,38,.1)]",  borderColor: "border-[rgba(220,38,38,.25)]",  dot: "bg-down" },
  neutral: { icon: Minus,        label: "Neutral",  textColor: "text-warn", bgColor: "bg-[rgba(217,119,6,.1)]",  borderColor: "border-[rgba(217,119,6,.25)]",  dot: "bg-warn" },
};

const VERDICT_CFG = {
  Bullish:    { color: "text-up",   bg: "bg-[rgba(5,150,105,.08)]",  border: "border-[rgba(5,150,105,.2)]" },
  Bearish:    { color: "text-down", bg: "bg-[rgba(220,38,38,.08)]",  border: "border-[rgba(220,38,38,.2)]" },
  Neutral:    { color: "text-warn", bg: "bg-[rgba(217,119,6,.08)]",  border: "border-[rgba(217,119,6,.2)]" },
  Accumulate: { color: "text-up",   bg: "bg-[rgba(5,150,105,.08)]",  border: "border-[rgba(5,150,105,.2)]" },
  Avoid:      { color: "text-down", bg: "bg-[rgba(220,38,38,.08)]",  border: "border-[rgba(220,38,38,.2)]" },
  Hold:       { color: "text-warn", bg: "bg-[rgba(217,119,6,.08)]",  border: "border-[rgba(217,119,6,.2)]" },
};

function OutlookCard({
  icon: Icon, title, timeframe, verdict, metric1Label, metric1, metric2Label, metric2, thesis, color,
}: {
  icon: React.ElementType; title: string; timeframe: string;
  verdict: string; metric1Label: string; metric1: string;
  metric2Label: string; metric2: string; thesis?: string; color: string;
}) {
  const vcfg = VERDICT_CFG[verdict as keyof typeof VERDICT_CFG] ?? VERDICT_CFG.Neutral;
  return (
    <div className="rounded-xl border p-4 transition-all hover:shadow-md" style={{ background: "var(--bg-elevated)", borderColor: "var(--bg-border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
            <Icon size={13} style={{ color }} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--txt-primary)]">{title}</p>
            <p className="text-[10px] text-[var(--txt-muted)] flex items-center gap-1">
              <Clock size={8} /> {timeframe}
            </p>
          </div>
        </div>
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border", vcfg.color, vcfg.bg, vcfg.border)}>
          {verdict}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="rounded-lg p-2.5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[9px] font-semibold text-[var(--txt-muted)] uppercase tracking-wider mb-1">
            {metric1Label}
          </p>
          <p className="text-xs font-mono font-semibold text-[var(--txt-primary)]">{metric1}</p>
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "var(--bg-card)" }}>
          <p className="text-[9px] font-semibold text-[var(--txt-muted)] uppercase tracking-wider mb-1">
            {metric2Label}
          </p>
          <p className="text-xs font-mono font-semibold text-[var(--txt-primary)]">{metric2}</p>
        </div>
      </div>
      {thesis && (
        <p className="text-[11px] text-[var(--txt-secondary)] leading-relaxed">{thesis}</p>
      )}
    </div>
  );
}

export function AISummaryPanel({ symbol, exchange, onAnalysisGenerated }: { symbol: string; exchange: string; onAnalysisGenerated?: () => void }) {
  const [data, setData] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/ai/summary?symbol=${symbol}&exchange=${exchange}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  const cfg = data ? SENTIMENT_CFG[data.sentiment as keyof typeof SENTIMENT_CFG] : null;

  return (
    <div className="card p-5 h-full flex flex-col" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
            <Sparkles size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--txt-primary)]">AI Analysis</p>
            <p className="text-[10px] text-[var(--txt-muted)]">RSI · MACD · Bollinger · SMA</p>
          </div>
        </div>
        {cfg && (
          <div className="flex items-center gap-2">
            <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border", cfg.textColor, cfg.bgColor, cfg.borderColor)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot, "animate-[pulseDot_2s_ease-in-out_infinite]")} />
              {cfg.label}
            </span>
            <button onClick={generate} className="btn-ghost p-1.5 rounded-lg" title="Refresh analysis">
              <RefreshCw size={11} style={{ color: "var(--txt-muted)" }} />
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 animate-float" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
            <Sparkles size={26} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-sm font-semibold text-[var(--txt-secondary)] mb-1.5">Dual-Horizon AI Analysis</p>
          <p className="text-xs text-[var(--txt-muted)] text-center mb-6 max-w-[200px] leading-relaxed">
            Short-term &amp; long-term outlook with specific price targets
          </p>
          <button onClick={generate}
            className="btn-primary text-sm gap-2"
            style={{ background: "var(--accent)", boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
            <Sparkles size={14} /> Generate Analysis
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full" style={{ border: "2px solid color-mix(in srgb, var(--accent) 20%, transparent)" }} />
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid transparent", borderTopColor: "var(--accent)" }} />
            <div className="absolute inset-2 rounded-full" style={{ border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)" }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--txt-secondary)]">Analysing…</p>
            <p className="text-[10px] text-[var(--txt-muted)] mt-1">RSI · MACD · Bollinger · 1Y chart</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-down text-sm py-3 px-3 rounded-xl border border-down/20 bg-down/5">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Result */}
      {data && !loading && (
        <div className="flex-1 flex flex-col gap-4 animate-fade-in">
          {/* Summary paragraph */}
          <div className="rounded-xl p-3.5" style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
            <p className="text-xs leading-relaxed text-[var(--txt-secondary)]">{data.summary}</p>
          </div>

          {/* Key points */}
          <div className="space-y-1.5">
            {data.keyPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl px-3 py-2 transition-all hover:shadow-sm group"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)" }}>
                <span className="text-xs leading-relaxed text-[var(--txt-secondary)] group-hover:text-[var(--txt-primary)] transition-colors">{pt}</span>
              </div>
            ))}
          </div>

          {/* Short + Long term outlook */}
          {(data.shortTermOutlook || data.longTermOutlook) && (
            <div className="grid grid-cols-1 gap-2.5">
              {data.shortTermOutlook && (
                <OutlookCard
                  icon={Target} title="Short-Term" color="var(--up)"
                  timeframe={data.shortTermOutlook.timeframe}
                  verdict={data.shortTermOutlook.verdict}
                  metric1Label="Target" metric1={data.shortTermOutlook.target}
                  metric2Label="Stop Loss" metric2={data.shortTermOutlook.stopLoss}
                />
              )}
              {data.longTermOutlook && (
                <OutlookCard
                  icon={ShieldAlert} title="Long-Term" color="var(--accent)"
                  timeframe={data.longTermOutlook.timeframe}
                  verdict={data.longTermOutlook.verdict}
                  metric1Label="12M Target" metric1={data.longTermOutlook.target}
                  metric2Label="Thesis" metric2=""
                  thesis={data.longTermOutlook.thesis}
                />
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[10px] text-[var(--txt-muted)] leading-relaxed pt-1 italic" style={{ borderTop: "1px solid var(--bg-border)" }}>
            {data.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
