/**
<<<<<<< HEAD
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
=======
 * fundamentalsService.ts — Data source map (verified against live APIs)
 *
 * FMP /stable/profile (FREE, 250/day):
 *   ✅ marketCap (mktCap), description, lastDividend, website, fullTimeEmployees, ipoDate
 *   ❌ priceToBook — NOT present for NSE stocks on free tier
 *   ❌ bookValuePerShare — NOT present for NSE stocks on free tier
 *
 * Yahoo Finance v11/quoteSummary (FREE, no auth needed for NSE):
 *   ✅ priceToBook  ← defaultKeyStatistics.priceToBook.raw
 *   ✅ bookValue    ← defaultKeyStatistics.bookValue.raw
 *   ✅ trailingEps  ← defaultKeyStatistics.trailingEps.raw (more accurate than Price÷PE)
 *   ✅ dividendYield ← summaryDetail.dividendYield.raw
 *   ✅ marketCap    ← summaryDetail.marketCap.raw
 *
 * Yahoo v8/chart meta (FREE, fallback):
 *   ⚠  priceToBook — inconsistent, sometimes present
 *
 * Derived from NSE (FREE, always):
 *   ✅ eps = price ÷ peRatio (fallback when Yahoo quoteSummary unavailable)
 */
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b

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
<<<<<<< HEAD
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
=======
  source?: "fmp" | "yahoo" | "derived" | "none";
}

function safeNum(v: unknown, decimals = 2): number | undefined {
  const n = Number(v);
  return isNaN(n) || n === 0 ? undefined : parseFloat(n.toFixed(decimals));
}
function toYahooSym(s: string, ex: "NSE"|"BSE") {
  return `${s.toUpperCase()}${ex === "NSE" ? ".NS" : ".BO"}`;
}

const YAHOO_HDR = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://finance.yahoo.com/",
};

// ── Layer 1: Yahoo v11/quoteSummary ────────────────────────────────────────────
// Best free source for P/B, Book Value, EPS for NSE stocks.
// Uses defaultKeyStatistics + summaryDetail modules — no crumb/cookie needed for .NS symbols.
async function fetchYahooQuoteSummary(
  symbol: string, exchange: "NSE"|"BSE"
): Promise<Partial<Fundamentals> | null> {
  try {
    const ySym = toYahooSym(symbol, exchange);
    const modules = "defaultKeyStatistics,summaryDetail,assetProfile";
    const url = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ySym)}?modules=${modules}`;
    const res = await fetch(url, { headers: YAHOO_HDR, signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.warn(`[fundamentals] Yahoo quoteSummary HTTP ${res.status} for ${symbol}`);
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json();
    const result = json?.quoteSummary?.result?.[0];
    if (!result) return null;

    const ks  = result.defaultKeyStatistics ?? {};
    const sd  = result.summaryDetail        ?? {};
    const ap  = result.assetProfile         ?? {};

    const out: Partial<Fundamentals> = {};

    // P/B and Book Value — reliable from defaultKeyStatistics
    if (ks.priceToBook?.raw)  out.pbRatio    = safeNum(ks.priceToBook.raw);
    if (ks.bookValue?.raw)    out.bookValue   = safeNum(ks.bookValue.raw);
    // EPS from trailing (more accurate than Price÷PE)
    if (ks.trailingEps?.raw)  out.eps         = safeNum(ks.trailingEps.raw);
    // Market cap & dividend from summaryDetail
    if (sd.marketCap?.raw)    out.marketCap   = Number(sd.marketCap.raw);
    if (sd.dividendYield?.raw) out.dividendYield = safeNum(sd.dividendYield.raw * 100);
    // Company profile from assetProfile
    if (ap.longBusinessSummary) out.description = ap.longBusinessSummary;
    if (ap.fullTimeEmployees)   out.employees   = Number(ap.fullTimeEmployees);
    if (ap.website)             out.website     = ap.website;

    const found = Object.keys(out).length > 0;
    console.log(`[fundamentals] Yahoo quoteSummary ${symbol}: pb=${out.pbRatio} bv=${out.bookValue} eps=${out.eps} found=${found}`);
    return found ? out : null;
  } catch (e) {
    console.warn(`[fundamentals] Yahoo quoteSummary error for ${symbol}:`, e);
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
    return null;
  }
}

<<<<<<< HEAD
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
=======
// ── Layer 2: FMP /stable/profile ───────────────────────────────────────────────
// Good for: marketCap, description, dividendYield, website, employees, ipoDate.
// Does NOT reliably return P/B for NSE stocks on free tier.
async function fetchFMPProfile(
  symbol: string, exchange: "NSE"|"BSE"
): Promise<Partial<Fundamentals> | null> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;
  try {
    const sym = encodeURIComponent(toYahooSym(symbol, exchange));
    const res = await fetch(
      `https://financialmodelingprep.com/stable/profile?symbol=${sym}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr: any[] = await res.json();
    const d = Array.isArray(arr) ? arr[0] : arr;
    if (!d) return null;

    const dividendYield = d.lastDividend && d.price > 0
      ? safeNum((d.lastDividend / d.price) * 100) : undefined;

    return {
      marketCap:    d.mktCap     ? Number(d.mktCap)  : d.marketCap ? Number(d.marketCap) : undefined,
      dividendYield,
      description:  d.description  ?? undefined,
      // Also try extracting P/B in case FMP adds it later or for some symbols
      pbRatio:      safeNum(d.priceToBook ?? d.pbRatio ?? d.pb),
      bookValue:    safeNum(d.bookValuePerShare ?? d.bookValue),
      employees:    d.fullTimeEmployees ? Number(d.fullTimeEmployees) : undefined,
      website:      d.website     ?? undefined,
      ipoDate:      d.ipoDate     ?? undefined,
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
    };
  } catch { return null; }
}

<<<<<<< HEAD
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
=======
// ── Layer 3: Yahoo v8/chart meta (last resort for P/B) ───────────────────────
async function fetchYahooChartMeta(
  symbol: string, exchange: "NSE"|"BSE"
): Promise<Partial<Fundamentals> | null> {
  try {
    const ySym = toYahooSym(symbol, exchange);
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}?interval=1d&range=1d`,
      { headers: YAHOO_HDR, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta: any = (await res.json())?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const out: Partial<Fundamentals> = {};
    if (meta.priceToBook)   out.pbRatio      = safeNum(meta.priceToBook);
    if (meta.bookValue)     out.bookValue     = safeNum(meta.bookValue);
    if (meta.dividendYield) out.dividendYield = safeNum(meta.dividendYield * 100);
    if (meta.marketCap)     out.marketCap     = Number(meta.marketCap);
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

// ── Public ───────────────────────────────────────────────────────────────────
export async function getFundamentals(
  symbol: string, exchange: "NSE"|"BSE" = "NSE",
  nsePrice?: number, nsePeRatio?: number,
): Promise<Fundamentals> {
  // Run all 3 sources in parallel — first one with data wins for each field
  const [qs, fmp, chart] = await Promise.allSettled([
    fetchYahooQuoteSummary(symbol, exchange),   // best for P/B, EPS
    fetchFMPProfile(symbol, exchange),           // best for mktCap, description
    fetchYahooChartMeta(symbol, exchange),       // fallback
  ]);
  const yahoo = qs.status   === "fulfilled" ? qs.value    : null;
  const fmpd  = fmp.status  === "fulfilled" ? fmp.value   : null;
  const chartd= chart.status === "fulfilled" ? chart.value : null;

  // EPS: Yahoo quoteSummary trailingEps is most accurate; derived as fallback
  const derivedEps = nsePrice && nsePeRatio && nsePeRatio > 0
    ? safeNum(nsePrice / nsePeRatio) : undefined;

  const result: Fundamentals = {
    // P/B: Yahoo quoteSummary → FMP profile → chart meta
    pbRatio:       yahoo?.pbRatio      ?? fmpd?.pbRatio    ?? chartd?.pbRatio,
    bookValue:     yahoo?.bookValue    ?? fmpd?.bookValue   ?? chartd?.bookValue,
    // EPS: Yahoo quoteSummary trailingEps → derived
    eps:           yahoo?.eps          ?? derivedEps,
    // Market cap: FMP preferred → Yahoo quoteSummary → chart meta
    marketCap:     fmpd?.marketCap     ?? yahoo?.marketCap  ?? chartd?.marketCap,
    // Dividend: FMP preferred (uses lastDividend/price) → Yahoo
    dividendYield: fmpd?.dividendYield ?? yahoo?.dividendYield ?? chartd?.dividendYield,
    // Description: FMP preferred → Yahoo assetProfile
    description:   fmpd?.description   ?? yahoo?.description,
    employees:     fmpd?.employees     ?? yahoo?.employees,
    website:       fmpd?.website       ?? yahoo?.website,
    ipoDate:       fmpd?.ipoDate,
    source:        yahoo ? "yahoo" : fmpd ? "fmp" : "none",
  };

  console.log(`[fundamentals] ${symbol} FINAL: pb=${result.pbRatio} bv=${result.bookValue} eps=${result.eps} mktCap=${result.marketCap ? "✓" : "✗"}`);
  return result;
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
}
