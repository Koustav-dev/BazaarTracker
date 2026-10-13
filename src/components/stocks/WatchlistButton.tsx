"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function WatchlistButton({ symbol, name, exchange, variant = "full" }: {
  symbol: string; name: string; exchange: "NSE"|"BSE"; variant?: "icon"|"full";
}) {
  const { data: session } = useSession();
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch("/api/watchlist").then(r => r.json()).then(j => {
      setInList((j.data ?? []).some((s: { symbol: string; exchange: string }) => s.symbol === symbol && s.exchange === exchange));
    }).catch(console.error);
  }, [session, symbol, exchange]);

  async function toggle() {
    if (!session) { toast.error("Sign in to use watchlist"); return; }
    setLoading(true);
    try {
      const method = inList ? "DELETE" : "POST";
      const res = await fetch("/api/watchlist", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol, name, exchange }),
      });
      if (!res.ok) throw new Error();
      setInList(!inList);
      toast.success(inList ? `${symbol} removed` : `${symbol} added`);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  if (variant === "icon") return (
    <button onClick={toggle} disabled={loading}
      className={cn("p-1.5 rounded-lg transition-colors", inList ? "text-accent bg-accent/10" : "text-txt-muted hover:text-txt-primary hover:bg-bg-elevated")}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : inList ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
    </button>
  );

  return (
    <button onClick={toggle} disabled={loading}
      className={cn("transition-all duration-150 rounded-xl text-sm font-medium px-4 py-2.5 flex items-center gap-2 border",
        inList
          ? "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20"
          : "btn-secondary"
      )}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : inList ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
      {inList ? "In Watchlist" : "Watchlist"}
    </button>
  );
}
