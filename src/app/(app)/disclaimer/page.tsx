import { AlertTriangle } from "lucide-react";
export default function Disclaimer() {
  return (
    <div className="page max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--warn) 10%, transparent)" }}>
          <AlertTriangle size={18} style={{ color: "var(--warn)" }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--txt-primary)" }}>Disclaimer</h1>
          <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Please read carefully before using Bazaar</p>
        </div>
      </div>
      <div className="card p-6 space-y-5 text-sm leading-relaxed" style={{ color: "var(--txt-secondary)", borderColor: "color-mix(in srgb, var(--warn) 20%, var(--bg-border))" }}>
        {[
          { title: "Not a SEBI Registered Advisor", body: "Bazaar is not registered with SEBI as an investment advisor, research analyst, or stock broker. The platform and its AI analysis do not constitute investment advice." },
          { title: "AI Analysis is Algorithmic", body: "AI-generated analysis is based on mathematical technical indicators (RSI, MACD, SMA, etc.) and pattern recognition. It does not account for fundamental business analysis, management quality, regulatory changes, or macroeconomic events." },
          { title: "Data May Be Delayed", body: "Market data from NSE and Yahoo Finance may be delayed by up to 15 minutes. Do not use this platform for high-frequency or intraday trading decisions." },
          { title: "Past Performance", body: "Any historical data, charts, or AI signals shown on this platform do not guarantee future performance. All investments carry risk, including the risk of total capital loss." },
          { title: "Do Your Own Research", body: "Before investing in any security, conduct your own due diligence. Consider consulting with a SEBI-registered investment advisor. Review company financials, annual reports, and exchange filings." },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="font-display font-semibold text-base mb-1.5" style={{ color: "var(--txt-primary)" }}>{title}</h2>
            <p>{body}</p>
          </div>
        ))}
        <div className="mt-2 p-4 rounded-xl text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--warn) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--warn) 20%, transparent)", color: "var(--warn)" }}>
          Investment in securities market is subject to market risks. Read all the related documents carefully before investing.
        </div>
      </div>
    </div>
  );
}
