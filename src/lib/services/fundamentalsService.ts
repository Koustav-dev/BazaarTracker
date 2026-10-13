/**
 * fundamentalsService.ts
 *
 * Collects fundamentals for a symbol from the free sources we have access to
 * and merges them field-by-field:
 *
 *   1. Yahoo quoteSummary (crumb-authenticated) — P/B, book value, EPS,
 *      dividend yield, market cap, company profile (sector, industry, website…)
 *   2. Financial Modeling Prep profile (optional, needs FMP_API_KEY)
 *   3. Derived values — EPS = price ÷ P/E, P/B = price ÷ book value
 */
import { yahooGet } from "./yahooClient";

export interface Fundamentals {
  eps?: number;
  pbRatio?: number;
  bookValue?: number;
  marketCap?: number;
  dividendYield?: number;
  description?: string;
  employees?: number;
  website?: string;
  ipoDate?: string;
  sector?: string;
  industry?: string;
  source?: "yahoo" | "fmp" | "derived" | "none";
}

function num(v: unknown, decimals = 2): number | undefined {
  const raw = typeof v === "object" && v !== null && "raw" in v ? (v as { raw: unknown }).raw : v;
  const n = Number(raw);
  return raw === null || raw === undefined || isNaN(n) || n === 0 ? undefined : parseFloat(n.toFixed(decimals));
}

const ySym = (s: string, ex: "NSE" | "BSE") => `${s.toUpperCase()}${ex === "NSE" ? ".NS" : ".BO"}`;

async function fromYahoo(symbol: string, exchange: "NSE" | "BSE"): Promise<Partial<Fundamentals> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await yahooGet<any>(
      `/v10/finance/quoteSummary/${encodeURIComponent(ySym(symbol, exchange))}`,
      { modules: "defaultKeyStatistics,summaryDetail,assetProfile,financialData" },
      { crumb: true },
    );
    const r = json?.quoteSummary?.result?.[0];
    if (!r) return null;
    const ks = r.defaultKeyStatistics ?? {};
    const sd = r.summaryDetail ?? {};
    const ap = r.assetProfile ?? {};
    const fd = r.financialData ?? {};

    const out: Partial<Fundamentals> = {
      pbRatio: num(ks.priceToBook),
      bookValue: num(ks.bookValue),
      eps: num(ks.trailingEps),
      marketCap: num(sd.marketCap, 0),
      description: ap.longBusinessSummary || undefined,
      employees: ap.fullTimeEmployees ? Number(ap.fullTimeEmployees) : undefined,
      website: ap.website || undefined,
      sector: ap.sector || undefined,
      industry: ap.industry || undefined,
    };
    // Yahoo reports dividendYield as a fraction (0.012 = 1.2%)
    const dy = num(sd.dividendYield, 4) ?? num(sd.trailingAnnualDividendYield, 4);
    if (dy) out.dividendYield = parseFloat((dy * 100).toFixed(2));
    if (!out.bookValue && fd.currentPrice && ks.priceToBook) {
      const p = num(fd.currentPrice), pb = num(ks.priceToBook);
      if (p && pb) out.bookValue = parseFloat((p / pb).toFixed(2));
    }
    return Object.values(out).some(v => v !== undefined) ? out : null;
  } catch (e) {
    console.warn(`[fundamentals] Yahoo quoteSummary failed for ${symbol}:`, String(e).slice(0, 100));
    return null;
  }
}

async function fromFMP(symbol: string, exchange: "NSE" | "BSE"): Promise<Partial<Fundamentals> | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(ySym(symbol, exchange))}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await res.json();
    const d = Array.isArray(body) ? body[0] : body;
    if (!d) return null;
    return {
      marketCap: d.marketCap ? Number(d.marketCap) : d.mktCap ? Number(d.mktCap) : undefined,
      dividendYield: d.lastDividend && d.price > 0 ? num((d.lastDividend / d.price) * 100) : undefined,
      description: d.description || undefined,
      employees: d.fullTimeEmployees ? Number(d.fullTimeEmployees) : undefined,
      website: d.website || undefined,
      ipoDate: d.ipoDate || undefined,
      sector: d.sector || undefined,
      industry: d.industry || undefined,
    };
  } catch { return null; }
}

export async function getFundamentals(
  symbol: string,
  exchange: "NSE" | "BSE" = "NSE",
  price?: number,
  peRatio?: number,
): Promise<Fundamentals> {
  const [y, f] = await Promise.all([fromYahoo(symbol, exchange), fromFMP(symbol, exchange)]);

  const derivedEps = price && peRatio && peRatio > 0 ? num(price / peRatio) : undefined;
  const bookValue = y?.bookValue ?? undefined;
  const pbRatio = y?.pbRatio ?? (price && bookValue ? num(price / bookValue) : undefined);

  return {
    pbRatio,
    bookValue,
    eps: y?.eps ?? derivedEps,
    marketCap: y?.marketCap ?? f?.marketCap,
    dividendYield: y?.dividendYield ?? f?.dividendYield,
    description: y?.description ?? f?.description,
    employees: y?.employees ?? f?.employees,
    website: y?.website ?? f?.website,
    ipoDate: f?.ipoDate,
    sector: y?.sector ?? f?.sector,
    industry: y?.industry ?? f?.industry,
    source: y ? "yahoo" : f ? "fmp" : derivedEps ? "derived" : "none",
  };
}
