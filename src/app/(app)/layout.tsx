"use client";
import React from "react";
import { useState, useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Bell, BookMarked, LayoutDashboard, LogOut, Menu, Search, TrendingUp, X, User, Sun, Moon, ChevronRight } from "lucide-react";
import { useTheme } from "@/app/providers";
import { useQuery } from "@tanstack/react-query";
import { MarketIndex } from "@/lib/types";
import { isMarketOpen } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search",    label: "Search",    icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: BookMarked },
  { href: "/alerts",    label: "Alerts",    icon: Bell },
];

function Ticker() {
  const { data: indices = [] } = useQuery<MarketIndex[]>({
    queryKey: ["indices"],
    queryFn: () => fetch("/api/stocks/indices").then(r => r.json()).then(j => j.data ?? []),
    refetchInterval: 60_000, staleTime: 30_000,
  });
  const open = isMarketOpen();
  if (!indices.length) return null;
  const items = [...indices, ...indices, ...indices];
  return (
    <div className="h-8 flex items-center overflow-hidden" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--bg-border)" }}>
      <div className="flex items-center gap-2.5 px-4 shrink-0 h-full" style={{ borderRight: "1px solid var(--bg-border)" }}>
        <span className={cn("w-1.5 h-1.5 rounded-full", open ? "live-dot" : "bg-[var(--txt-muted)]")} />
        <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-[var(--txt-muted)] whitespace-nowrap">
          {open ? "Live" : "Closed"}
        </span>
      </div>
      <div className="ticker-wrap flex-1">
        <div className="ticker-inner flex items-center gap-8 pl-6">
          {items.map((idx, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-[11px]">
              <span className="text-[var(--txt-muted)] font-medium">{idx.name}</span>
              <span className="text-[var(--txt-primary)] font-mono font-semibold">{idx.value.toLocaleString("en-IN")}</span>
              <span className={idx.changePercent >= 0 ? "text-up" : "text-down"} style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {idx.changePercent >= 0 ? "▲" : "▼"}{Math.abs(idx.changePercent).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="btn-ghost p-2 rounded-xl" aria-label="Toggle theme">
      {theme === "dark"
        ? <Sun size={15} className="text-warn transition-transform hover:rotate-45" />
        : <Moon size={15} className="text-[var(--accent)] transition-transform hover:-rotate-12" />}
    </button>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/login");
  }, [status, router]);

  if (status === "loading") return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--accent)" }}>
          <TrendingUp size={16} color="white" />
        </div>
        <div>
          <p className="font-display font-bold text-[var(--txt-primary)]">Bazaar</p>
          <div className="flex gap-1 mt-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-[var(--accent)]"
                style={{ animation: `pulseDot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <Ticker />

      {/* Navbar */}
      <header className={cn("sticky top-0 z-50 transition-all duration-300", scrolled && "shadow-md")}
        style={{
          background: scrolled ? "color-mix(in srgb, var(--bg-base) 92%, transparent)" : "var(--bg-base)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: "1px solid var(--bg-border)",
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-14 flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg"
                style={{ background: "var(--accent)", boxShadow: "0 2px 8px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
                <TrendingUp size={15} color="white" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-[var(--txt-primary)]">Bazaar</span>
            </Link>

            {/* Desktop nav — pill style */}
            <nav className="hidden md:flex items-center gap-0.5 px-1.5 py-1 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}>
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}
                    className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150")}
                    style={{
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "white" : "var(--txt-secondary)",
                      boxShadow: active ? "0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)" : "none",
                    }}>
                    <Icon size={13} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <ThemeToggle />
              {session && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-default"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                    <User size={11} style={{ color: "var(--accent)" }} />
                  </div>
                  <span className="text-sm text-[var(--txt-secondary)] font-medium">{firstName}</span>
                  <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="btn-ghost p-1 rounded-lg ml-1" title="Sign out">
                    <LogOut size={12} style={{ color: "var(--txt-muted)" }} />
                  </button>
                </div>
              )}

              {/* Mobile hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden btn-ghost p-2 rounded-xl"
                style={{ background: "var(--bg-card)", border: "1px solid var(--bg-border)" }}>
                {mobileOpen ? <X size={17} /> : <Menu size={17} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu — full drawer */}
        {mobileOpen && (
          <div className="md:hidden animate-fade-in" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--bg-border)" }}>
            <div className="px-4 pt-2 pb-4 space-y-1">
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                return (
                  <Link key={href} href={href}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "transparent",
                      color: active ? "var(--accent)" : "var(--txt-secondary)",
                    }}>
                    <span className="flex items-center gap-3"><Icon size={16} />{label}</span>
                    <ChevronRight size={14} style={{ opacity: active ? 1 : 0.3 }} />
                  </Link>
                );
              })}
              <div className="pt-3 mt-2" style={{ borderTop: "1px solid var(--bg-border)" }}>
                {session && (
                  <div className="flex items-center gap-3 px-4 py-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
                      <User size={14} style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--txt-primary)]">{session.user?.name}</p>
                      <p className="text-xs text-[var(--txt-muted)]">{session.user?.email}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-down"
                  style={{ background: "rgba(220,38,38,.06)" }}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
