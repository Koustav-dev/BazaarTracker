"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { ChartDataPoint } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const RANGES = ["1d","5d","1mo","3mo","6mo","1y"] as const;
type Range = typeof RANGES[number];
const LABELS: Record<Range, string> = { "1d":"1D","5d":"5D","1mo":"1M","3mo":"3M","6mo":"6M","1y":"1Y" };

function fmtDate(d: string, r: Range) {
  try {
    const dt = parseISO(d);
    if (r === "1d") return format(dt, "HH:mm");
    if (r === "5d") return format(dt, "dd MMM");
    if (r === "1mo" || r === "3mo") return format(dt, "dd MMM");
    return format(dt, "MMM yy");
  } catch { return ""; }
}

export function PriceChart({ symbol, exchange, changePercent }: {
  symbol: string; exchange: string; changePercent: number;
}) {
  const [range, setRange] = useState<Range>("3mo");
  const isUp = changePercent >= 0;
  const color = isUp ? "#00d4aa" : "#ff4d6d";
  const gid = `grad-${symbol}-${isUp ? "up" : "dn"}`;

  const { data = [], isLoading } = useQuery({
    queryKey: ["chart", symbol, exchange, range],
    queryFn: () =>
      fetch(`/api/stocks/chart?symbol=${symbol}&exchange=${exchange}&range=${range}`)
        .then(r => r.json()).then(j => j.data ?? []) as Promise<ChartDataPoint[]>,
    staleTime: 60_000,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-bg-card border border-bg-border rounded-xl px-3 py-2 shadow-modal text-xs">
        <p className="text-txt-muted mb-1">{fmtDate(label, range)}</p>
        <p className="font-mono font-semibold" style={{ color }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  };

  const minVal = data.length ? Math.min(...data.map(d => d.close)) * 0.998 : 0;
  const maxVal = data.length ? Math.max(...data.map(d => d.close)) * 1.002 : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-txt-secondary">Price Chart</p>
        <div className="flex items-center gap-1 bg-bg-elevated rounded-xl p-1 border border-bg-border">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("px-2.5 py-1 text-xs font-medium rounded-lg transition-all",
                range === r ? "bg-accent text-bg-base font-semibold" : "text-txt-muted hover:text-txt-primary")}>
              {LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${color} transparent transparent transparent` }} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e2d45" strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="date" tickFormatter={d => fmtDate(d, range)}
                tick={{ fill: "#4a5a7a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[minVal, maxVal]}
                tickFormatter={v => `${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`}
                tick={{ fill: "#4a5a7a", fontSize: 10, fontFamily: "JetBrains Mono" }}
                axisLine={false} tickLine={false} width={48} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={1.5}
                fill={`url(#${gid})`} dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: "#080b12" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
