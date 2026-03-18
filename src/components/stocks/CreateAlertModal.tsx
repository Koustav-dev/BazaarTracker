"use client";
import React from "react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function CreateAlertModal({ symbol, name, exchange, currentPrice, onClose }: {
  symbol: string; name: string; exchange: "NSE"|"BSE"; currentPrice: number; onClose: () => void;
}) {
  const { data: session } = useSession();
  const [condition, setCondition] = useState<"above"|"below">("above");
  const [target, setTarget] = useState((currentPrice * 1.05).toFixed(2));
  const [email, setEmail] = useState(true);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) { toast.error("Sign in first"); return; }
    const price = parseFloat(target);
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name, exchange, condition, targetPrice: price, notifyEmail: email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Alert created!");
      onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-bg-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg-card border border-bg-border rounded-2xl shadow-modal w-full max-w-md animate-fade-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center">
              <Bell size={14} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-txt-primary">Set Price Alert</p>
              <p className="text-xs text-txt-muted">{symbol} · {exchange}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={16} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="bg-bg-elevated rounded-xl p-3 flex items-center justify-between border border-bg-border">
            <p className="text-xs text-txt-muted">Current Price</p>
            <p className="font-display font-bold text-lg text-txt-primary">₹{currentPrice.toLocaleString("en-IN")}</p>
          </div>

          <div>
            <label className="label">Alert When</label>
            <div className="grid grid-cols-2 gap-2">
              {(["above","below"] as const).map(c => (
                <button key={c} type="button"
                  onClick={() => { setCondition(c); setTarget(c === "above" ? (currentPrice * 1.05).toFixed(2) : (currentPrice * 0.95).toFixed(2)); }}
                  className={cn("py-2.5 rounded-xl text-sm font-medium border transition-all capitalize",
                    condition === c ? "border-accent/60 bg-accent/10 text-accent" : "border-bg-border text-txt-secondary hover:border-bg-hover"
                  )}>
                  {c === "above" ? "↑ Above" : "↓ Below"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Target Price (₹)</label>
            <input type="number" step="0.01" min="0.01" value={target}
              onChange={e => setTarget(e.target.value)} className="input font-mono" required />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-bg-elevated rounded-xl border border-bg-border">
            <div onClick={() => setEmail(!email)}
              className={cn("w-10 h-5 rounded-full relative transition-colors flex items-center shrink-0 cursor-pointer",
                email ? "bg-accent" : "bg-bg-border")}>
              <span className={cn("absolute w-4 h-4 bg-bg-base rounded-full shadow transition-all",
                email ? "left-[22px]" : "left-0.5")} />
            </div>
            <div>
              <p className="text-sm font-medium text-txt-primary">Email notification</p>
              <p className="text-xs text-txt-muted">Get emailed when alert triggers</p>
            </div>
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading && <Loader2 size={13} className="animate-spin" />}
              Create Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
