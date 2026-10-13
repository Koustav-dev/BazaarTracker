import axios from "axios";
import { StockQuote, StockDetails, ChartDataPoint, StockSearchResult, MarketIndex } from "@/lib/types";
import { getFundamentals } from "./fundamentalsService";
import { yahooGet } from "./yahooClient";

// ─── Constants ────────────────────────────────────────────────────────────────
const NSE_BASE = "https://www.nseindia.com";
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const NSE_HEADERS = {
  "User-Agent": BROWSER_UA,
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.nseindia.com/",
  Connection: "keep-alive",
};

// ─── NSE session + circuit breaker ────────────────────────────────────────────
// NSE blocks many cloud/datacenter IPs. Yahoo is the primary source, so NSE is
// a best-effort enrichment: after a failure we skip it for a few minutes
// instead of making every request wait for a timeout.
let nseCookie = "";
let nseCookieAt = 0;
let nseDownUntil = 0;
const NSE_COOKIE_TTL = 20 * 60 * 1000;
const NSE_COOLDOWN = 5 * 60 * 1000;

async function getNSECookie(): Promise<string> {
  if (nseCookie && Date.now() - nseCookieAt < NSE_COOKIE_TTL) return nseCookie;
  const res = await axios.get(NSE_BASE, { headers: NSE_HEADERS, timeout: 6000, maxRedirects: 3 });
  const set = res.headers["set-cookie"];
  if (set?.length) {
    nseCookie = set.map((c: string) => c.split(";")[0]).join("; ");
    nseCookieAt = Date.now();
  }
  return nseCookie;
}

async function nseGet<T = unknown>(path: string, params: Record<string, string>, timeout = 6000): Promise<T> {
  if (Date.now() < nseDownUntil) throw new Error("NSE temporarily skipped");
  try {
    const cookie = await getNSECookie();
    const { data } = await axios.get(`${NSE_BASE}${path}`, {
      params, timeout, headers: { ...NSE_HEADERS, Cookie: cookie },
    });
    return data as T;
  } catch (e) {
    nseCookie = "";
    nseDownUntil = Date.now() + NSE_COOLDOWN;
    throw e;
  }
}

// ─── In-memory response cache ─────────────────────────────────────────────────
const cache = new Map<string, { data: unknown; at: number }>();
function cacheGet<T>(key: string, ttlMs: number): T | null {
  const e = cache.get(key);
  return e && Date.now() - e.at < ttlMs ? (e.data as T) : null;
}
function cacheSet(key: string, data: unknown) { cache.set(key, { data, at: Date.now() }); }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toYahooSym = (symbol: string, exchange: "NSE" | "BSE") =>
  `${symbol.toUpperCase()}${exchange === "NSE" ? ".NS" : ".BO"}`;

function safe(v: unknown, decimals = 2): number | undefined {
  const n = Number(v);
  return isNaN(n) || n === 0 ? undefined : parseFloat(n.toFixed(decimals));
}
const r2 = (n: number) => parseFloat(n.toFixed(2));

// ─── Yahoo: quote (v7 /quote carries PE, EPS, 52W, market cap, etc.) ─────────
async function fetchYahooQuote(symbol: string, exchange: "NSE" | "BSE"): Promise<StockDetails> {
  const ySym = toYahooSym(symbol, exchange);

  // Preferred: v7 quote (rich fields)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await yahooGet<any>("/v7/finance/quote", { symbols: ySym }, { crumb: true });
    const q = json?.quoteResponse?.result?.[0];
    if (q && (q.regularMarketPrice ?? 0) > 0) {
      const price = q.regularMarketPrice;
      const prev = q.regularMarketPreviousClose ?? price;
      const change = q.regularMarketChange ?? price - prev;
      const pct = q.regularMarketChangePercent ?? (prev ? (change / prev) * 100 : 0);
      return {
        symbol: symbol.toUpperCase(),
        name: q.longName || q.shortName || symbol.toUpperCase(),
        exchange,
        price: r2(price),
        change: r2(change),
        changePercent: r2(pct),
        open: r2(q.regularMarketOpen ?? price),
        high: r2(q.regularMarketDayHigh ?? price),
        low: r2(q.regularMarketDayLow ?? price),
        previousClose: r2(prev),
        volume: q.regularMarketVolume ?? 0,
        marketCap: q.marketCap || undefined,
        currency: q.currency ?? "INR",
        timestamp: q.regularMarketTime ?? Date.now() / 1000,
        peRatio: safe(q.trailingPE),
        eps: safe(q.epsTrailingTwelveMonths),
        week52High: safe(q.fiftyTwoWeekHigh),
        week52Low: safe(q.fiftyTwoWeekLow),
        bookValue: safe(q.bookValue),
        pbRatio: safe(q.priceToBook),
        // Yahoo's quote endpoint already returns dividendYield as a percentage
        dividendYield: safe(q.dividendYield),
        dataSource: "yahoo",
      };
    }
  } catch (e) {
    console.warn(`[quote] Yahoo v7 failed for ${ySym}:`, String(e).slice(0, 100));
  }

  // Fallback: v8 chart meta (works without a crumb)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await yahooGet<any>(`/v8/finance/chart/${encodeURIComponent(ySym)}`, { interval: "1d", range: "5d" });
  const result = data?.chart?.result?.[0];
  if (!result?.meta) throw new Error(`No Yahoo data for ${ySym}`);
  const meta = result.meta;
  const price = meta.regularMarketPrice ?? meta.previousClose;
  if (!price) throw new Error(`No Yahoo price for ${ySym}`);
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  return {
    symbol: symbol.toUpperCase(),
    name: meta.longName || meta.shortName || symbol.toUpperCase(),
    exchange,
    price: r2(price),
    change: r2(change),
    changePercent: r2(prev ? (change / prev) * 100 : 0),
    open: r2(meta.regularMarketOpen ?? price),
    high: r2(meta.regularMarketDayHigh ?? price),
    low: r2(meta.regularMarketDayLow ?? price),
    previousClose: r2(prev),
    volume: meta.regularMarketVolume ?? 0,
    marketCap: meta.marketCap || undefined,
    currency: meta.currency ?? "INR",
    timestamp: meta.regularMarketTime ?? Date.now() / 1000,
    week52High: safe(meta.fiftyTwoWeekHigh),
    week52Low: safe(meta.fiftyTwoWeekLow),
    dataSource: "yahoo",
  };
}

// ─── NSE: quote + trade info (optional enrichment) ────────────────────────────
async function fetchNSEQuote(symbol: string): Promise<Partial<StockDetails>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = await nseGet<any>("/api/quote-equity", { symbol: symbol.toUpperCase() });
  const pd = d?.priceInfo ?? {};
  const md = d?.metadata ?? {};
  const fi = d?.securityInfo ?? {};
  const info = d?.info ?? {};
  const ind = d?.industryInfo ?? {};

  const price = pd.lastPrice ?? pd.close ?? 0;
  if (!price) throw new Error("NSE returned no price");
  const prev = pd.previousClose ?? price;
  const change = pd.change ?? price - prev;
  const pct = pd.pChange ?? (prev ? (change / prev) * 100 : 0);

  return {
    symbol: symbol.toUpperCase(),
    name: info.companyName || md.companyName || symbol,
    exchange: "NSE",
    price: r2(price),
    change: r2(change),
    changePercent: r2(pct),
    open: safe(pd.open) ?? price,
    high: safe(pd.intraDayHighLow?.max) ?? price,
    low: safe(pd.intraDayHighLow?.min) ?? price,
    previousClose: r2(prev),
    timestamp: Date.now() / 1000,
    peRatio: safe(md.pdSymbolPe),
    vwap: safe(pd.vwap),
    marketCapLabel: md.pdMarketCapLabel ?? undefined,
    week52High: safe(pd.weekHighLow?.max),
    week52Low: safe(pd.weekHighLow?.min),
    faceValue: safe(fi.faceValue),
    sector: ind.sector || ind.macro || undefined,
    industry: ind.basicIndustry || ind.industry || info.industry || undefined,
    totalBuyQty: safe(pd.totalBuyQuantity, 0),
    totalSellQty: safe(pd.totalSellQuantity, 0),
  };
}

async function fetchNSEDelivery(symbol: string): Promise<number | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ti = await nseGet<any>("/api/quote-equity", { symbol: symbol.toUpperCase(), section: "trade_info" }, 6000);
  const swdp = ti?.securityWiseDP ?? ti?.marketDeptOrderBook?.securityWiseDP ?? {};
  const raw = swdp.deliveryToTradedQuantity ?? swdp.deliveryQuantityToTradedQuantity;
  const d = parseFloat(String(raw));
  return !isNaN(d) && d > 0 ? parseFloat(d.toFixed(2)) : undefined;
}

// ─── Public: getStockQuote ────────────────────────────────────────────────────
export async function getStockQuote(symbol: string, exchange: "NSE" | "BSE" = "NSE"): Promise<StockQuote> {
  const key = `quote:${symbol}:${exchange}`;
  const cached = cacheGet<StockQuote>(key, 45_000);
  if (cached) return cached;

  let result: StockQuote | null = null;
  try { result = await fetchYahooQuote(symbol, exchange); } catch { /* try NSE */ }
  if (!result && exchange === "NSE") {
    const nse = await fetchNSEQuote(symbol);
    if (nse.price) result = { ...(nse as StockQuote), volume: 0, currency: "INR" };
  }
  if (!result) throw new Error(`Could not fetch quote for ${symbol}`);
  cacheSet(key, result);
  return result;
}

// ─── Public: getStockDetails ──────────────────────────────────────────────────
export async function getStockDetails(symbol: string, exchange: "NSE" | "BSE" = "NSE"): Promise<StockDetails> {
  const key = `details:${symbol}:${exchange}`;
  const cached = cacheGet<StockDetails>(key, 30_000);
  if (cached) return cached;

  const [yRes, nseRes, delRes] = await Promise.allSettled([
    fetchYahooQuote(symbol, exchange),
    exchange === "NSE" ? fetchNSEQuote(symbol) : Promise.reject(new Error("BSE")),
    exchange === "NSE" ? fetchNSEDelivery(symbol) : Promise.reject(new Error("BSE")),
  ]);
  const y = yRes.status === "fulfilled" ? yRes.value : null;
  const nse = nseRes.status === "fulfilled" ? nseRes.value : null;
  const deliveryPercent = delRes.status === "fulfilled" ? delRes.value : undefined;

  if (!y && !nse) throw new Error(`Could not fetch data for ${symbol}`);

  // Price fields: NSE is the exchange of record when reachable; Yahoo otherwise.
  const price = nse?.price || y?.price || 0;
  const f = await getFundamentals(symbol, exchange, price, nse?.peRatio ?? y?.peRatio);

  const peRatio = nse?.peRatio ?? y?.peRatio;
  const dataSource: StockDetails["dataSource"] = nse ? (y || f.source === "yahoo" ? "nse+yahoo" : "nse") : "yahoo";

  const result: StockDetails = {
    symbol: symbol.toUpperCase(),
    name: nse?.name || y?.name || symbol.toUpperCase(),
    exchange,
    price,
    change: nse?.change ?? y?.change ?? 0,
    changePercent: nse?.changePercent ?? y?.changePercent ?? 0,
    open: nse?.open || y?.open || price,
    high: nse?.high || y?.high || price,
    low: nse?.low || y?.low || price,
    previousClose: nse?.previousClose || y?.previousClose || 0,
    volume: y?.volume ?? 0, // NSE's quote has no reliable volume field; Yahoo does
    marketCap: y?.marketCap || f.marketCap,
    currency: "INR",
    timestamp: nse?.timestamp ?? y?.timestamp ?? Date.now() / 1000,

    peRatio,
    eps: y?.eps ?? f.eps,
    pbRatio: y?.pbRatio ?? f.pbRatio,
    bookValue: y?.bookValue ?? f.bookValue,
    week52High: nse?.week52High ?? y?.week52High,
    week52Low: nse?.week52Low ?? y?.week52Low,
    dividendYield: y?.dividendYield ?? f.dividendYield,
    sector: nse?.sector || f.sector,
    industry: nse?.industry || f.industry,
    description: f.description,
    employees: f.employees,
    ipoDate: f.ipoDate,
    website: f.website,
    vwap: nse?.vwap,
    marketCapLabel: nse?.marketCapLabel ?? capLabel(y?.marketCap || f.marketCap),
    faceValue: nse?.faceValue,
    deliveryPercent,
    totalBuyQty: nse?.totalBuyQty,
    totalSellQty: nse?.totalSellQty,
    dataSource,
  };
  cacheSet(key, result);
  return result;
}

// Rough SEBI-style buckets (₹ crore): large ≥ 1 lakh Cr, mid ≥ 30k Cr
function capLabel(mc?: number): string | undefined {
  if (!mc) return undefined;
  const cr = mc / 1e7;
  return cr >= 100_000 ? "LARGE CAP" : cr >= 30_000 ? "MID CAP" : "SMALL CAP";
}

// ─── Public: getChartData ─────────────────────────────────────────────────────
export async function getChartData(
  symbol: string, exchange: "NSE" | "BSE" = "NSE",
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" = "1mo",
): Promise<ChartDataPoint[]> {
  const key = `chart:${symbol}:${exchange}:${range}`;
  const cached = cacheGet<ChartDataPoint[]>(key, range === "1d" ? 60_000 : 300_000);
  if (cached) return cached;

  const interval: Record<string, string> = {
    "1d": "5m", "5d": "15m", "1mo": "1d", "3mo": "1d", "6mo": "1d", "1y": "1d", "2y": "1d", "5y": "1wk",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await yahooGet<any>(
    `/v8/finance/chart/${encodeURIComponent(toYahooSym(symbol, exchange))}`,
    { interval: interval[range] ?? "1d", range },
    { timeoutMs: 15000 },
  );
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No chart data for ${symbol}`);
  const ts: number[] = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const points = ts
    .map((t, i) => ({
      date: new Date(t * 1000).toISOString(),
      open: r2(q.open?.[i] ?? 0),
      high: r2(q.high?.[i] ?? 0),
      low: r2(q.low?.[i] ?? 0),
      close: r2(q.close?.[i] ?? 0),
      volume: q.volume?.[i] ?? 0,
    }))
    .filter(d => d.close > 0);
  cacheSet(key, points);
  return points;
}

// ─── Public: searchStocks ─────────────────────────────────────────────────────
// Local NSE list for instant results, then live NSE / Yahoo search.
// ─── Public: searchStocks ─────────────────────────────────────────────────────
// Large local NSE list + NSE live search API
const NSE_STOCKS: StockSearchResult[] = [
  // Nifty 50
  { symbol:"RELIANCE",    name:"Reliance Industries Ltd",           exchange:"NSE", type:"EQUITY", sector:"Energy" },
  { symbol:"TCS",         name:"Tata Consultancy Services Ltd",     exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"HDFCBANK",    name:"HDFC Bank Ltd",                     exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"INFY",        name:"Infosys Ltd",                       exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"ICICIBANK",   name:"ICICI Bank Ltd",                    exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"HINDUNILVR",  name:"Hindustan Unilever Ltd",            exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"SBIN",        name:"State Bank of India",               exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"BAJFINANCE",  name:"Bajaj Finance Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"BHARTIARTL",  name:"Bharti Airtel Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Telecom" },
  { symbol:"KOTAKBANK",   name:"Kotak Mahindra Bank Ltd",           exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"LT",          name:"Larsen & Toubro Ltd",               exchange:"NSE", type:"EQUITY", sector:"Construction" },
  { symbol:"ITC",         name:"ITC Ltd",                           exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"HCLTECH",     name:"HCL Technologies Ltd",              exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"ASIANPAINT",  name:"Asian Paints Ltd",                  exchange:"NSE", type:"EQUITY", sector:"Chemicals" },
  { symbol:"MARUTI",      name:"Maruti Suzuki India Ltd",           exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"AXISBANK",    name:"Axis Bank Ltd",                     exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"SUNPHARMA",   name:"Sun Pharmaceutical Industries",     exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"TITAN",       name:"Titan Company Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Consumer" },
  { symbol:"WIPRO",       name:"Wipro Ltd",                         exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"ULTRACEMCO",  name:"UltraTech Cement Ltd",              exchange:"NSE", type:"EQUITY", sector:"Cement" },
  { symbol:"NESTLEIND",   name:"Nestle India Ltd",                  exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"TATAMOTORS",  name:"Tata Motors Ltd",                   exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"NTPC",        name:"NTPC Ltd",                          exchange:"NSE", type:"EQUITY", sector:"Power" },
  { symbol:"POWERGRID",   name:"Power Grid Corporation of India",   exchange:"NSE", type:"EQUITY", sector:"Power" },
  { symbol:"ONGC",        name:"Oil & Natural Gas Corporation",     exchange:"NSE", type:"EQUITY", sector:"Energy" },
  { symbol:"TATASTEEL",   name:"Tata Steel Ltd",                    exchange:"NSE", type:"EQUITY", sector:"Metals" },
  { symbol:"ADANIENT",    name:"Adani Enterprises Ltd",             exchange:"NSE", type:"EQUITY", sector:"Conglomerate" },
  { symbol:"ADANIPORTS",  name:"Adani Ports & SEZ Ltd",             exchange:"NSE", type:"EQUITY", sector:"Infrastructure" },
  { symbol:"JSWSTEEL",    name:"JSW Steel Ltd",                     exchange:"NSE", type:"EQUITY", sector:"Metals" },
  { symbol:"GRASIM",      name:"Grasim Industries Ltd",             exchange:"NSE", type:"EQUITY", sector:"Cement" },
  { symbol:"TECHM",       name:"Tech Mahindra Ltd",                 exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"INDUSINDBK",  name:"IndusInd Bank Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"CIPLA",       name:"Cipla Ltd",                         exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"DRREDDY",     name:"Dr. Reddys Laboratories Ltd",       exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"DIVISLAB",    name:"Divi Laboratories Ltd",             exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"BAJAJFINSV",  name:"Bajaj Finserv Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"HEROMOTOCO",  name:"Hero MotoCorp Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"EICHERMOT",   name:"Eicher Motors Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"BRITANNIA",   name:"Britannia Industries Ltd",          exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"COALINDIA",   name:"Coal India Ltd",                    exchange:"NSE", type:"EQUITY", sector:"Mining" },
  { symbol:"BPCL",        name:"Bharat Petroleum Corporation",      exchange:"NSE", type:"EQUITY", sector:"Energy" },
  { symbol:"TATACONSUM",  name:"Tata Consumer Products Ltd",        exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"HINDALCO",    name:"Hindalco Industries Ltd",           exchange:"NSE", type:"EQUITY", sector:"Metals" },
  // Popular beyond Nifty 50
  { symbol:"ZOMATO",      name:"Eternal Ltd (Zomato)",              exchange:"NSE", type:"EQUITY", sector:"Consumer Tech" },
  { symbol:"ETERNAL",     name:"Eternal Ltd (Zomato)",              exchange:"NSE", type:"EQUITY", sector:"Consumer Tech" },
  { symbol:"PAYTM",       name:"One97 Communications (Paytm)",      exchange:"NSE", type:"EQUITY", sector:"Fintech" },
  { symbol:"NYKAA",       name:"FSN E-Commerce Ventures (Nykaa)",   exchange:"NSE", type:"EQUITY", sector:"Consumer Tech" },
  { symbol:"DMART",       name:"Avenue Supermarts Ltd (DMart)",      exchange:"NSE", type:"EQUITY", sector:"Retail" },
  { symbol:"PIDILITIND",  name:"Pidilite Industries Ltd",           exchange:"NSE", type:"EQUITY", sector:"Chemicals" },
  { symbol:"HAVELLS",     name:"Havells India Ltd",                  exchange:"NSE", type:"EQUITY", sector:"Consumer" },
  { symbol:"VEDL",        name:"Vedanta Ltd",                        exchange:"NSE", type:"EQUITY", sector:"Metals" },
  { symbol:"JIOFIN",      name:"Jio Financial Services Ltd",        exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"IRFC",        name:"Indian Railway Finance Corp",        exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"IREDA",       name:"Indian Renewable Energy Dev Agency", exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"BSE",         name:"BSE Ltd",                            exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"MANKIND",     name:"Mankind Pharma Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"TATTECH",     name:"Tata Technologies Ltd",              exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"SWIGGY",      name:"Swiggy Ltd",                         exchange:"NSE", type:"EQUITY", sector:"Consumer Tech" },
  { symbol:"IXIGO",       name:"Le Travenues Technology (ixigo)",    exchange:"NSE", type:"EQUITY", sector:"Consumer Tech" },
  { symbol:"POLICYBZR",   name:"PB Fintech (PolicyBazaar)",         exchange:"NSE", type:"EQUITY", sector:"Fintech" },
  { symbol:"MAMAEARTH",   name:"Honasa Consumer (Mamaearth)",        exchange:"NSE", type:"EQUITY", sector:"Consumer" },
  { symbol:"BAJAJ-AUTO",  name:"Bajaj Auto Ltd",                     exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"M&M",         name:"Mahindra & Mahindra Ltd",            exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"TATAPOWER",   name:"Tata Power Company Ltd",             exchange:"NSE", type:"EQUITY", sector:"Power" },
  { symbol:"AMBUJACEM",   name:"Ambuja Cements Ltd",                 exchange:"NSE", type:"EQUITY", sector:"Cement" },
  { symbol:"SHREECEM",    name:"Shree Cement Ltd",                   exchange:"NSE", type:"EQUITY", sector:"Cement" },
  { symbol:"BANKBARODA",  name:"Bank of Baroda",                     exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"PNB",         name:"Punjab National Bank",               exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"CANBK",       name:"Canara Bank",                        exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"IDFCFIRSTB",  name:"IDFC First Bank Ltd",                exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"FEDERALBNK",  name:"Federal Bank Ltd",                   exchange:"NSE", type:"EQUITY", sector:"Banking" },
  { symbol:"MUTHOOTFIN",  name:"Muthoot Finance Ltd",                exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"CHOLAFIN",    name:"Cholamandalam Investment & Finance", exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"LICHSGFIN",   name:"LIC Housing Finance Ltd",            exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"RECLTD",      name:"REC Ltd",                            exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"PFC",         name:"Power Finance Corporation Ltd",      exchange:"NSE", type:"EQUITY", sector:"Finance" },
  { symbol:"APOLLOHOSP",  name:"Apollo Hospitals Enterprise Ltd",    exchange:"NSE", type:"EQUITY", sector:"Healthcare" },
  { symbol:"FORTIS",      name:"Fortis Healthcare Ltd",              exchange:"NSE", type:"EQUITY", sector:"Healthcare" },
  { symbol:"MAXHEALTH",   name:"Max Healthcare Institute Ltd",       exchange:"NSE", type:"EQUITY", sector:"Healthcare" },
  { symbol:"MPHASIS",     name:"Mphasis Ltd",                        exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"LTIM",        name:"LTIMindtree Ltd",                    exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"PERSISTENT",  name:"Persistent Systems Ltd",             exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"COFORGE",     name:"Coforge Ltd",                        exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"TATAELXSI",   name:"Tata Elxsi Ltd",                     exchange:"NSE", type:"EQUITY", sector:"IT" },
  { symbol:"ZYDUSLIFE",   name:"Zydus Lifesciences Ltd",             exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"LUPIN",       name:"Lupin Ltd",                          exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"TORNTPHARM",  name:"Torrent Pharmaceuticals Ltd",        exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"ABBOTINDIA",  name:"Abbott India Ltd",                   exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"AUROPHARMA",  name:"Aurobindo Pharma Ltd",               exchange:"NSE", type:"EQUITY", sector:"Pharma" },
  { symbol:"PAGEIND",     name:"Page Industries Ltd",                exchange:"NSE", type:"EQUITY", sector:"Textile" },
  { symbol:"TRENT",       name:"Trent Ltd",                          exchange:"NSE", type:"EQUITY", sector:"Retail" },
  { symbol:"JUBLFOOD",    name:"Jubilant Foodworks Ltd",             exchange:"NSE", type:"EQUITY", sector:"Consumer" },
  { symbol:"DEVYANI",     name:"Devyani International Ltd",          exchange:"NSE", type:"EQUITY", sector:"Consumer" },
  { symbol:"VARUNBEV",    name:"Varun Beverages Ltd",                exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"GODREJCP",    name:"Godrej Consumer Products Ltd",       exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"DABUR",       name:"Dabur India Ltd",                    exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"MARICO",      name:"Marico Ltd",                         exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"COLPAL",      name:"Colgate-Palmolive India Ltd",        exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"EMAMILTD",    name:"Emami Ltd",                          exchange:"NSE", type:"EQUITY", sector:"FMCG" },
  { symbol:"BERGEPAINT",  name:"Berger Paints India Ltd",            exchange:"NSE", type:"EQUITY", sector:"Chemicals" },
  { symbol:"KANSAINER",   name:"Kansai Nerolac Paints Ltd",          exchange:"NSE", type:"EQUITY", sector:"Chemicals" },
  { symbol:"INDIGO",      name:"InterGlobe Aviation (IndiGo)",       exchange:"NSE", type:"EQUITY", sector:"Aviation" },
  { symbol:"SPICEJET",    name:"SpiceJet Ltd",                       exchange:"NSE", type:"EQUITY", sector:"Aviation" },
  { symbol:"ADANIGREEN",  name:"Adani Green Energy Ltd",             exchange:"NSE", type:"EQUITY", sector:"Power" },
  { symbol:"ADANITRANS",  name:"Adani Transmission Ltd",             exchange:"NSE", type:"EQUITY", sector:"Power" },
  { symbol:"ADANIPOWER",  name:"Adani Power Ltd",                    exchange:"NSE", type:"EQUITY", sector:"Power" },
  { symbol:"APOLLOTYRE",  name:"Apollo Tyres Ltd",                   exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"MRF",         name:"MRF Ltd",                            exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"CEAT",        name:"CEAT Ltd",                           exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"BALKRISIND",  name:"Balkrishna Industries Ltd",          exchange:"NSE", type:"EQUITY", sector:"Auto" },
  { symbol:"DLF",         name:"DLF Ltd",                            exchange:"NSE", type:"EQUITY", sector:"Real Estate" },
  { symbol:"OBEROIRLTY",  name:"Oberoi Realty Ltd",                  exchange:"NSE", type:"EQUITY", sector:"Real Estate" },
  { symbol:"PRESTIGE",    name:"Prestige Estates Projects Ltd",      exchange:"NSE", type:"EQUITY", sector:"Real Estate" },
  { symbol:"GODREJPROP",  name:"Godrej Properties Ltd",              exchange:"NSE", type:"EQUITY", sector:"Real Estate" },
  { symbol:"SIEMENS",     name:"Siemens Ltd",                        exchange:"NSE", type:"EQUITY", sector:"Capital Goods" },
  { symbol:"ABB",         name:"ABB India Ltd",                      exchange:"NSE", type:"EQUITY", sector:"Capital Goods" },
  { symbol:"CUMMINSIND",  name:"Cummins India Ltd",                  exchange:"NSE", type:"EQUITY", sector:"Capital Goods" },
  { symbol:"THERMAX",     name:"Thermax Ltd",                        exchange:"NSE", type:"EQUITY", sector:"Capital Goods" },
];

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase().trim();

  function score(s: { symbol: string; name: string; sector?: string }): number {
    const sym = s.symbol.toLowerCase();
    const name = s.name.toLowerCase();
    if (sym === q || name === q) return 100;
    if (sym.startsWith(q)) return 90;
    if (name.startsWith(q)) return 80;
    if (sym.includes(q)) return 70;
    if (name.includes(q)) return 60;
    if (name.split(" ").some(t => t.startsWith(q))) return 55;
    if (s.sector?.toLowerCase().includes(q)) return 30;
    let qi = 0;
    for (const c of sym) { if (c === q[qi]) qi++; if (qi === q.length) return 20; }
    return 0;
  }

  const local: StockSearchResult[] = NSE_STOCKS
    .map(s => ({ s, sc: score(s) }))
    .filter(x => x.sc > 0)
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 8)
    .map(x => x.s);

  const merged = [...local];
  const add = (r: StockSearchResult) => {
    if (!merged.some(m => m.symbol === r.symbol)) merged.push(r);
  };

  // Live search: NSE first, Yahoo if NSE is unreachable
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await nseGet<any>("/api/search/autocomplete", { q: query.toUpperCase() }, 5000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data?.symbols ?? []).slice(0, 6).forEach((i: any) =>
      add({ symbol: i.symbol, name: i.symbol_info || i.company_name || i.symbol, exchange: "NSE", type: i.asset_type || "EQUITY" }));
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await yahooGet<any>("/v1/finance/search", { q: query, quotesCount: "8", newsCount: "0" }, { timeoutMs: 5000 });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data?.quotes ?? []).filter((x: any) => x.quoteType === "EQUITY" && /\.(NS|BO)$/.test(x.symbol ?? ""))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .forEach((x: any) => add({
          symbol: x.symbol.replace(/\.(NS|BO)$/, ""),
          name: x.longname || x.shortname || x.symbol,
          exchange: x.symbol.endsWith(".BO") ? "BSE" : "NSE",
          type: "EQUITY",
          sector: x.sector,
        }));
    } catch { /* local results only */ }
  }
  return merged.slice(0, 10);
}

// ─── Public: getMarketIndices ─────────────────────────────────────────────────
const INDEX_SYMBOLS = [
  { symbol: "^NSEI", name: "NIFTY 50" },
  { symbol: "^BSESN", name: "SENSEX" },
  { symbol: "^NSEBANK", name: "NIFTY BANK" },
  { symbol: "^CNXIT", name: "NIFTY IT" },
];

export async function getMarketIndices(): Promise<MarketIndex[]> {
  const cached = cacheGet<MarketIndex[]>("indices", 45_000);
  if (cached) return cached;

  const results = await Promise.allSettled(INDEX_SYMBOLS.map(async ({ symbol, name }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await yahooGet<any>(`/v8/finance/chart/${encodeURIComponent(symbol)}`, { interval: "1d", range: "5d" }, { timeoutMs: 8000 });
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) throw new Error("no meta");
    const price: number = meta.regularMarketPrice;
    const prev: number = meta.chartPreviousClose || meta.previousClose || price;
    return { name, symbol, value: r2(price), change: r2(price - prev), changePercent: r2(prev ? ((price - prev) / prev) * 100 : 0) } as MarketIndex;
  }));
  let indices = results.filter((r): r is PromiseFulfilledResult<MarketIndex> => r.status === "fulfilled").map(r => r.value);

  // If Yahoo came up short, try NSE's all-indices feed
  if (indices.length < 3) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await nseGet<any>("/api/allIndices", {}, 8000);
      const wanted = ["NIFTY 50", "NIFTY BANK", "NIFTY IT", "NIFTY MIDCAP 100"];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nse: MarketIndex[] = (data?.data ?? []).filter((i: any) => wanted.includes(i.index))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((i: any) => ({ name: i.index, symbol: i.index, value: r2(Number(i.last)), change: r2(Number(i.variation)), changePercent: r2(Number(i.percentChange)) }));
      for (const n of nse) if (!indices.some(i => i.name === n.name)) indices.push(n);
    } catch { /* keep what we have */ }
  }
  if (indices.length) cacheSet("indices", indices);
  return indices;
}

// ─── Public: getBulkQuotes ────────────────────────────────────────────────────
export async function getBulkQuotes(symbols: { symbol: string; exchange: "NSE" | "BSE" }[]): Promise<StockQuote[]> {
  const results = await Promise.allSettled(symbols.map(({ symbol, exchange }) => getStockQuote(symbol, exchange)));
  return results.filter((r): r is PromiseFulfilledResult<StockQuote> => r.status === "fulfilled").map(r => r.value);
}
