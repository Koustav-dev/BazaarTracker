"use client";
import React from "react";
import Link from "next/link";
import { StockQuote } from "@/lib/types";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { addRecent } from "@/lib/utils";

export function StockCard({ stock, actions }: { stock: StockQuote; actions?: React.ReactNode }) {
  const isUp = stock.changePercent >= 0;
  const color = isUp ? "var(--up)" : "var(--down)";
  const vol = stock.volume > 0 ? stock.volume.toLocaleString("en-IN") : null;

  return (
    <Link
      href={`/stock/${stock.symbol}?exchange=${stock.exchange}`}
      onClick={() => addRecent(stock.symbol, stock.name, stock.exchange)}
      className="block card-hover p-4 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-mono font-bold text-sm text-[var(--txt-primary)]">{stock.symbol}</p>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md hidden sm:block"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
              {stock.exchange}
            </span>
          </div>
          <p className="text-[11px] text-[var(--txt-muted)] truncate leading-snug">{stock.name}</p>
        </div>
        <span className={cn("text-[10px] font-mono font-semibold px-2 py-1 rounded-lg ml-2 shrink-0 flex items-center gap-0.5", isUp ? "badge-up" : "badge-down")}>
          {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {formatPercent(stock.changePercent)}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display font-bold text-xl" style={{ color: "var(--txt-primary)" }}>
            {formatCurrency(stock.price)}
          </p>
          <p className="text-[10px] font-mono mt-0.5" style={{ color }}>
            {isUp ? "+" : ""}{formatCurrency(stock.change)}
          </p>
        </div>
        {vol && (
          <p className="text-[10px] text-[var(--txt-muted)] font-mono text-right">
            Vol<br />{vol}
          </p>
        )}
      </div>

      {/* Bottom glow bar on hover */}
      <div className="mt-3 h-0.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      {actions && <div className="mt-3">{actions}</div>}
    </Link>
  );
}
