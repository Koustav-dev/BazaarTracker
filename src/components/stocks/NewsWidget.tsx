"use client";
import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink, Clock, RefreshCw } from "lucide-react";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  image: string | null;
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3.6e6);
    const d = Math.floor(diff / 8.64e7);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    if (d < 7)  return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

export function NewsWidget({ symbol, name }: { symbol: string; name?: string }) {
  const { data: articles = [], isLoading, isError, refetch, isFetching } = useQuery<NewsArticle[]>({
    queryKey: ["news", symbol],
    queryFn: () => {
      const params = new URLSearchParams({ symbol });
      if (name) params.set("name", name.split(" ").slice(0, 3).join(" ")); // first 3 words of name
      return fetch(`/api/stocks/news?${params}`).then(r => r.json()).then(j => j.data ?? []);
    },
    staleTime: 5 * 60_000,
    retry: 2,
  });

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
            <Newspaper size={12} style={{ color: "var(--accent)" }} />
          </div>
          <p className="section-title">Latest News</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
            {symbol}
          </span>
        </div>
        <button onClick={() => refetch()} className="btn-ghost p-1.5 rounded-lg" title="Refresh news">
          <RefreshCw size={11} className={isFetching ? "animate-spin" : ""} style={{ color: "var(--txt-muted)" }} />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-full rounded" />
                <div className="skeleton h-3.5 w-3/4 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-6">
          <p className="text-xs text-[var(--txt-muted)] mb-3">Could not load news</p>
          <button onClick={() => refetch()} className="btn-ghost text-xs gap-1.5">
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && articles.length === 0 && (
        <div className="text-center py-8">
          <Newspaper size={22} className="mx-auto mb-3" style={{ color: "var(--txt-muted)", opacity: 0.4 }} />
          <p className="text-xs font-medium" style={{ color: "var(--txt-muted)" }}>No news found for {symbol}</p>
          <p className="text-[10px] mt-1" style={{ color: "var(--txt-muted)", opacity: 0.7 }}>Try refreshing or check back later</p>
        </div>
      )}

      {/* Articles */}
      {!isLoading && articles.length > 0 && (
        <div className="divide-y" style={{ borderColor: "var(--bg-border)" }}>
          {articles.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
              className="block py-3 group first:pt-0 last:pb-0 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug mb-1.5 line-clamp-2 transition-colors group-hover:underline"
                    style={{ color: "var(--txt-primary)" }}>
                    {a.title}
                  </p>
                  {a.description && (
                    <p className="text-[10px] leading-relaxed mb-1.5 line-clamp-1" style={{ color: "var(--txt-muted)" }}>
                      {a.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold capitalize px-1.5 py-0.5 rounded"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
                      {a.source}
                    </span>
                    {a.publishedAt && (
                      <span className="text-[9px] text-[var(--txt-muted)] flex items-center gap-0.5">
                        <Clock size={8} /> {timeAgo(a.publishedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink size={10} className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--accent)" }} />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer source note */}
      {!isLoading && articles.length > 0 && (
        <p className="text-[9px] mt-4 pt-3" style={{ borderTop: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
          Sources: Google News · Economic Times · Moneycontrol
        </p>
      )}
    </div>
  );
}
