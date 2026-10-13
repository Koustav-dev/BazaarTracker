"use client";
import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, X, Loader2, Clock } from "lucide-react";
import { StockSearchResult } from "@/lib/types";
import { addRecent } from "@/lib/utils";

// Client-side fuzzy: allow 1-2 char typos via simple edit-distance heuristic
function fuzzyMatch(text: string, q: string): boolean {
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  if (t.includes(query)) return true;
  // Allow 1 transposition or substitution for queries ≥4 chars
  if (query.length >= 4) {
    let mismatches = 0;
    if (t.length >= query.length) {
      for (let i = 0; i < query.length; i++) {
        if (t[i] !== query[i]) mismatches++;
        if (mismatches > 1) break;
      }
      if (mismatches <= 1) return true;
    }
  }
  return false;
}

interface Props { placeholder?: string; className?: string; }

export function StockSearch({ placeholder = "Search stocks…", className = "" }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("bazaar_search_history") ?? "[]");
      setRecentSearches(saved.slice(0, 5));
    } catch {}
  }, []);

  const saveSearch = (sym: string) => {
    const updated = [sym, ...recentSearches.filter(s => s !== sym)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("bazaar_search_history", JSON.stringify(updated));
  };

  const search = useCallback(async (val: string) => {
    if (val.length < 1) { setResults([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(val)}`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (val: string) => {
    setQ(val);
    setActive(-1);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    timerRef.current = setTimeout(() => search(val.trim()), 280);
  };

  // Client-side fuzzy filter on top of server results
  const filtered = q.length > 0
    ? results.filter(r => fuzzyMatch(r.symbol, q) || fuzzyMatch(r.name, q))
    : results;
  const displayed = filtered.length > 0 ? filtered : results;

  const go = (r: StockSearchResult) => {
    saveSearch(r.symbol);
    addRecent(r.symbol, r.name, r.exchange);
    router.push(`/stock/${r.symbol}?exchange=${r.exchange}`);
    setQ(""); setOpen(false); setResults([]);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown")  { e.preventDefault(); setActive(a => Math.min(a + 1, displayed.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
    if (e.key === "Enter" && active >= 0) { go(displayed[active]); }
    if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  };

  const showRecents = q.length === 0 && recentSearches.length > 0;

  return (
    <div className={`relative ${className}`} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      {/* Input */}
      <div className="relative group">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: open ? "var(--accent)" : "var(--txt-muted)" }} />
        <input
          ref={inputRef}
          value={q}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className="input pl-10 pr-10 transition-all"
          style={{ fontFamily: "var(--font-body)" }}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" style={{ color: "var(--accent)" }} />}
        {q && !loading && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 transition-colors hover:bg-[var(--bg-hover)]"
            onMouseDown={e => { e.preventDefault(); setQ(""); setResults([]); inputRef.current?.focus(); }}>
            <X size={13} style={{ color: "var(--txt-muted)" }} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (showRecents || displayed.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden animate-scale-in"
          style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)", boxShadow: "0 12px 40px rgba(0,0,0,.15)" }}>

          {/* Recent searches */}
          {showRecents && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-[10px] font-semibold text-[var(--txt-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock size={9} /> Recent
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {recentSearches.map(s => (
                  <button key={s}
                    className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium transition-all hover:shadow-sm"
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-secondary)" }}
                    onMouseDown={e => { e.preventDefault(); handleChange(s); }}
                  >{s}</button>
                ))}
              </div>
              <div style={{ height: 1, background: "var(--bg-border)", margin: "0 -12px" }} />
            </div>
          )}

          {/* Results */}
          {displayed.length > 0 && (
            <div className="py-1.5">
              {displayed.map((r, i) => (
                <button key={`${r.symbol}-${r.exchange}`}
                  onMouseDown={e => { e.preventDefault(); go(r); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-all"
                  style={{
                    background: active === i ? "var(--bg-elevated)" : "transparent",
                    borderLeft: active === i ? `2px solid var(--accent)` : "2px solid transparent",
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{ background: "color-mix(in srgb, var(--accent) 10%, var(--bg-elevated))" }}>
                    <TrendingUp size={13} style={{ color: "var(--accent)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[var(--txt-primary)]">{r.symbol}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
                        {r.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--txt-muted)] truncate">{r.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {q && !loading && displayed.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--txt-muted)]">No results for &quot;{q}&quot;</p>
              <p className="text-xs text-[var(--txt-muted)] mt-1">Try a different name or NSE symbol</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
