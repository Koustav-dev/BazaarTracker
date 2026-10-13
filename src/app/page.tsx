import Link from "next/link";
import { TrendingUp, BarChart2, Bell, Sparkles, ArrowRight, Zap, Shield, Activity } from "lucide-react";

const FEATURES = [
  { icon: Activity,  title: "Live NSE + BSE",      desc: "Live prices and charts for NSE and BSE stocks" },
  { icon: BarChart2, title: "Technical Analysis",  desc: "RSI, MACD, Bollinger Bands, SMA 20/50/200 calculated automatically" },
  { icon: Sparkles,  title: "AI Research Notes",   desc: "An AI model reads the indicators and fundamentals and drafts short- and long-term views with price levels" },
  { icon: Bell,      title: "Price Alerts",        desc: "Email notifications the moment your target price is hit" },
  { icon: Zap,       title: "Instant Search",      desc: "100+ stocks in local index with NSE autocomplete for any symbol" },
  { icon: Shield,    title: "Data from Source",    desc: "PE, EPS, P/B, 52-week range and market cap, with delivery % from NSE when available" },
];

const TICKERS = ["RELIANCE +0.8%","TCS -0.3%","HDFCBANK +1.2%","INFY +0.6%","BAJFINANCE -0.4%","ZOMATO +3.1%","SBIN +0.9%","TATAMOTORS -0.7%","ADANIENT +1.5%","WIPRO +0.2%","NIFTY 50 +0.4%","SENSEX +0.3%","ITC +0.7%","AXISBANK -0.2%"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
        {/* Grid */}
        <div className="absolute inset-0 grid-bg opacity-60" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center shadow-glow-sm">
            <TrendingUp size={15} className="text-bg-base" />
          </div>
          <span className="font-display font-bold text-lg text-txt-primary">Bazaar</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Start free</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-medium px-3 py-1.5 rounded-full mb-6 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-dot" style={{ boxShadow: "0 0 5px #00d4aa" }} />
          NSE · BSE · Real-time · AI Analysis
        </div>

        <h1 className="font-display font-bold text-5xl sm:text-7xl text-txt-primary mb-5 leading-tight animate-stagger-1">
          Indian stocks,<br />
          <span className="text-accent" style={{ textShadow: "0 0 40px rgba(0,212,170,.4)" }}>seriously analysed</span>
        </h1>

        <p className="text-lg text-txt-muted max-w-xl mb-10 leading-relaxed animate-stagger-2">
          NSE & BSE prices with technical indicators — RSI, MACD, Bollinger Bands — and an AI that turns them into a plain-language outlook.
        </p>

        <div className="flex items-center gap-3 flex-wrap justify-center animate-stagger-3">
          <Link href="/auth/register" className="btn-primary px-8 py-3.5 text-base shadow-glow">
            Start tracking free <ArrowRight size={16} />
          </Link>
          <Link href="/auth/login" className="btn-secondary px-8 py-3.5 text-base">
            Sign in
          </Link>
        </div>

        {/* Ticker strip */}
        <div className="w-full max-w-3xl mt-16 animate-stagger-4">
          <div className="ticker-wrap bg-bg-card border border-bg-border rounded-2xl py-3">
            <div className="ticker-inner flex items-center gap-8 px-4">
              {[...TICKERS, ...TICKERS].map((t, i) => {
                const up = t.includes("+");
                return (
                  <span key={i} className={`text-xs font-mono font-medium whitespace-nowrap ${up ? "text-up" : "text-down"}`}>
                    {t}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto w-full px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} style={{ animation: `fadeUp 0.4s ${200 + i * 80}ms cubic-bezier(.16,1,.3,1) both` }}
              className="card-hover p-5 group">
              <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
                <Icon size={16} className="text-accent" />
              </div>
              <h3 className="font-display font-semibold text-sm text-txt-primary mb-1">{title}</h3>
              <p className="text-xs text-txt-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-bg-border py-6 text-center">
        <p className="text-xs text-txt-muted">Not financial advice. Data from NSE & Yahoo Finance.</p>
      </footer>
    </div>
  );
}
