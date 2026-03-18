import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7)  return `₹${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5)  return `₹${(value / 1e5).toFixed(2)} L`;
  return `₹${value.toFixed(2)}`;
}

export function formatVolume(value: number): string {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return value.toString();
}

export function formatPercent(value: number, includeSign = true): string {
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  const totalMin = ist.getHours() * 60 + ist.getMinutes();
  return day >= 1 && day <= 5 && totalMin >= 555 && totalMin <= 930; // 9:15–15:30
}

export function getChangeColor(change: number): string {
  if (change > 0) return "text-up";
  if (change < 0) return "text-down";
  return "text-surface-400";
}

export function getChangeBadgeClass(change: number): string {
  if (change > 0) return "bg-up/10 text-up font-medium";
  if (change < 0) return "bg-down/10 text-down font-medium";
  return "bg-surface-100 text-surface-500";
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

export function getISTTime(): string {
  return new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getISTDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface RecentStock {
  symbol: string;
  name: string;
  exchange: string;
  ts: number;
}

export function getRecents(): RecentStock[] {
  try { return JSON.parse(localStorage.getItem("bazaar_recents") ?? "[]"); } catch { return []; }
}

export function addRecent(symbol: string, name: string, exchange: string): void {
  try {
    const list = getRecents().filter(r => r.symbol !== symbol).slice(0, 9);
    list.unshift({ symbol, name, exchange, ts: Date.now() });
    localStorage.setItem("bazaar_recents", JSON.stringify(list.slice(0, 10)));
  } catch { /* localStorage unavailable in SSR */ }
}
