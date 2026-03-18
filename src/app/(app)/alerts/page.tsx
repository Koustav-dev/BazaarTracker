"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/lib/types";
import { Bell, Trash2, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Clock, Plus, Zap } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

function AlertCard({ alert, onDelete, isDeleting }: {
  alert: Alert;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const isAbove   = alert.condition === "above";
  const triggered = alert.status === "triggered";
  const up        = isAbove;

  return (
    <div className={cn("card p-4 transition-all hover:shadow-md group")}
      style={{
        borderColor: triggered
          ? "color-mix(in srgb, var(--up) 25%, var(--bg-border))"
          : "var(--bg-border)",
        opacity: isDeleting ? 0.4 : 1,
      }}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: triggered ? "color-mix(in srgb, var(--up) 10%, transparent)" : `color-mix(in srgb, ${up ? "var(--up)" : "var(--down)"} 8%, var(--bg-elevated))` }}>
          {triggered
            ? <CheckCircle2 size={16} style={{ color: "var(--up)" }} />
            : isAbove
              ? <TrendingUp  size={16} style={{ color: "var(--up)" }} />
              : <TrendingDown size={16} style={{ color: "var(--down)" }} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-sm text-[var(--txt-primary)]">{alert.symbol}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>{alert.exchange}</span>
            <span className={cn("text-[9px] font-semibold px-2 py-0.5 rounded-full")}
              style={{
                background: triggered ? "color-mix(in srgb, var(--up) 10%, transparent)" : "color-mix(in srgb, var(--accent) 10%, transparent)",
                color: triggered ? "var(--up)" : "var(--accent)",
                border: `1px solid ${triggered ? "color-mix(in srgb, var(--up) 20%, transparent)" : "color-mix(in srgb, var(--accent) 20%, transparent)"}`,
              }}>
              {triggered ? "✓ Triggered" : "● Active"}
            </span>
          </div>

          <p className="text-sm text-[var(--txt-secondary)] mt-1 font-medium">
            {alert.name}
          </p>

          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-[var(--txt-muted)]">Condition</p>
              <p className="text-xs font-mono font-semibold" style={{ color: isAbove ? "var(--up)" : "var(--down)" }}>
                {isAbove ? "↑ Above" : "↓ Below"} ₹{alert.targetPrice.toLocaleString("en-IN")}
              </p>
            </div>
            {triggered && alert.currentPrice && (
              <div>
                <p className="text-[9px] uppercase tracking-wider font-semibold text-[var(--txt-muted)]">Triggered at</p>
                <p className="text-xs font-mono font-semibold text-[var(--up)]">₹{alert.currentPrice.toLocaleString("en-IN")}</p>
              </div>
            )}
            {alert.notifyEmail && (
              <div className="flex items-center gap-1">
                <Zap size={9} style={{ color: "var(--accent)" }} />
                <p className="text-[9px] text-[var(--txt-muted)]">Email alert</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href={`/stock/${alert.symbol}?exchange=${alert.exchange}`}
            className="btn-ghost p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={13} />
          </Link>
          <button onClick={() => onDelete(alert._id)} disabled={isDeleting}
            className="btn-ghost p-2 rounded-xl text-down opacity-0 group-hover:opacity-100 transition-opacity hover:bg-down/10">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: () => fetch("/api/alerts").then(r => r.json()).then(j => j.data ?? []),
    refetchInterval: 30_000,
  });

  async function removeAlert(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert removed");
    } catch { toast.error("Failed to remove"); }
    finally { setDeleting(null); }
  }

  const active    = alerts.filter(a => a.status === "active");
  const triggered = alerts.filter(a => a.status === "triggered");

  return (
    <div className="page space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-up">
        <div>
          <h1 className="font-display font-bold text-2xl text-[var(--txt-primary)]">Price Alerts</h1>
          <p className="text-sm text-[var(--txt-muted)] mt-1">
            {active.length} active · {triggered.length} triggered
          </p>
        </div>
        <Link href="/search" className="btn-primary gap-2 text-sm">
          <Plus size={14} /> New Alert
        </Link>
      </div>

      {/* Info banner — how alerts work */}
      <div className="card p-4 animate-fade-up" style={{ animationDelay: "40ms", borderColor: "color-mix(in srgb, var(--accent) 20%, var(--bg-border))", background: "color-mix(in srgb, var(--accent) 4%, var(--bg-card))" }}>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
            <Bell size={13} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--txt-primary)] mb-0.5">How alerts work</p>
            <p className="text-xs text-[var(--txt-muted)] leading-relaxed">
              Alerts are checked every 5 minutes during NSE market hours (9:15 AM – 3:30 PM IST, Mon–Fri).
              When your target price is hit, the alert status changes to &quot;Triggered&quot; and you receive an email if enabled.
              Alerts trigger once and are not recurring — set a new one after it fires.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="card p-14 text-center animate-fade-up" style={{ border: "1.5px dashed var(--bg-border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 animate-float"
            style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
            <Bell size={22} style={{ color: "var(--accent)" }} />
          </div>
          <h3 className="font-display font-semibold text-[var(--txt-primary)] mb-2">No alerts yet</h3>
          <p className="text-sm text-[var(--txt-muted)] mb-6 max-w-xs mx-auto">
            Open any stock page and tap &quot;Alert&quot; to get notified when the price hits your target.
          </p>
          <Link href="/search" className="btn-primary mx-auto">
            Find Stocks <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section className="animate-fade-up" style={{ animationDelay: "80ms" }}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={12} style={{ color: "var(--txt-muted)" }} />
                <p className="section-title">Watching</p>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)" }}>
                  {active.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {active.map((a, i) => (
                  <div key={a._id} style={{ animation: `fadeUp .4s ${i * 50}ms cubic-bezier(.16,1,.3,1) both` }}>
                    <AlertCard alert={a} onDelete={removeAlert} isDeleting={deleting === a._id} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {triggered.length > 0 && (
            <section className="animate-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={12} style={{ color: "var(--up)" }} />
                <p className="section-title">Triggered</p>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" style={{ background: "color-mix(in srgb, var(--up) 12%, transparent)", color: "var(--up)" }}>
                  {triggered.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {triggered.map((a, i) => (
                  <div key={a._id} style={{ animation: `fadeUp .4s ${i * 50}ms cubic-bezier(.16,1,.3,1) both` }}>
                    <AlertCard alert={a} onDelete={removeAlert} isDeleting={deleting === a._id} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
