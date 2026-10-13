import Link from "next/link";
import { TrendingUp, Github, Twitter, Mail, Shield, Bell, BarChart2, Search, Bookmark } from "lucide-react";

const NAV_LINKS = {
  Product: [
    { label: "Dashboard",  href: "/dashboard",  icon: BarChart2 },
    { label: "Search",     href: "/search",     icon: Search },
    { label: "Watchlist",  href: "/watchlist",  icon: Bookmark },
    { label: "Alerts",     href: "/alerts",     icon: Bell },
  ],
  Resources: [
    { label: "NSE Official",    href: "https://www.nseindia.com",  external: true },
    { label: "BSE Official",    href: "https://www.bseindia.com",  external: true },
    { label: "SEBI Investor",   href: "https://investor.sebi.gov.in", external: true },
    { label: "RBI Publications",href: "https://www.rbi.org.in",   external: true },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy",   href: "/privacy" },
    { label: "Disclaimer",       href: "/disclaimer" },
  ],
};

const DATA_SOURCES = [
  { name: "Yahoo Finance", desc: "Prices, charts, PE, EPS, P/B, 52W, market cap", color: "#059669" },
  { name: "NSE",           desc: "Delivery %, VWAP (when reachable)",           color: "#2563eb" },
  { name: "Groq AI",       desc: "AI analysis (GPT-OSS 120B)",                  color: "#d97706" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "var(--bg-card)", borderTop: "1px solid var(--bg-border)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: "var(--accent)", boxShadow: "0 2px 10px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                <TrendingUp size={16} color="white" />
              </div>
              <span className="font-display font-bold text-xl" style={{ color: "var(--txt-primary)" }}>Bazaar</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--txt-muted)" }}>
              Real-time NSE &amp; BSE stock intelligence. AI-powered dual-horizon analysis,
              technical indicators, watchlists and instant price alerts.
            </p>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--txt-muted)" }}>Data Sources</p>
              <div className="flex flex-wrap gap-2">
                {DATA_SOURCES.map(({ name, desc, color }) => (
                  <div key={name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold" title={desc}
                    style={{ background: `color-mix(in srgb, ${color} 8%, var(--bg-elevated))`, border: `1px solid color-mix(in srgb, ${color} 18%, var(--bg-border))` }}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span style={{ color: "var(--txt-secondary)" }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[
                { href: "https://github.com", Icon: Github,  label: "GitHub" },
                { href: "https://twitter.com", Icon: Twitter, label: "Twitter" },
                { href: "mailto:hello@bazaar.app", Icon: Mail, label: "Email" },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-muted)" }}>
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(NAV_LINKS).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--txt-muted)" }}>{title}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href, ...rest }) => (
                  <li key={label}>
                    {"external" in rest && rest.external ? (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="text-sm transition-colors hover:underline" style={{ color: "var(--txt-secondary)" }}>
                        {label}
                      </a>
                    ) : (
                      <Link href={href} className="text-sm transition-colors hover:underline inline-flex items-center gap-1.5"
                        style={{ color: "var(--txt-secondary)" }}>
                        {"icon" in rest && rest.icon && <rest.icon size={11} style={{ color: "var(--txt-muted)" }} />}
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer bar */}
      <div style={{ borderTop: "1px solid var(--bg-border)", background: "var(--bg-elevated)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Shield size={11} className="mt-0.5 shrink-0" style={{ color: "var(--txt-muted)" }} />
            <p className="text-[10px] leading-relaxed" style={{ color: "var(--txt-muted)" }}>
              <strong style={{ color: "var(--txt-secondary)" }}>Not financial advice.</strong>{" "}
              Bazaar is an educational tool only. All AI analysis is algorithmic and not a recommendation to buy or sell.
              NSE data may be delayed up to 15 minutes during off-peak hours. Past performance is not indicative of future results.
            </p>
          </div>
          <p className="text-[10px] whitespace-nowrap" style={{ color: "var(--txt-muted)" }}>© {year} Bazaar</p>
        </div>
      </div>
    </footer>
  );
}
