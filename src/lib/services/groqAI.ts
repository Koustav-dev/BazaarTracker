<<<<<<< HEAD
import { StockDetails, ChartDataPoint, AISummary } from "@/lib/types";

// ─── Model config ─────────────────────────────────────────────────────────────
// llama-3.3-70b-versatile was shut down by Groq on 16 Aug 2026.
// Override with GROQ_MODEL if Groq retires these in future.
const PRIMARY_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODELS = ["qwen/qwen3.6-27b", "openai/gpt-oss-20b"];
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

interface ChatOpts { temperature?: number; maxTokens?: number; json?: boolean }

async function groqChat(prompt: string, { temperature = 0.2, maxTokens = 4000, json = false }: ChatOpts = {}): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(m => m !== PRIMARY_MODEL)];
  let lastErr = "";

  for (const model of models) {
    const isGptOss = model.startsWith("openai/gpt-oss");
    // Reasoning models spend part of the budget on hidden reasoning tokens,
    // so the completion limit must be generous or the JSON gets cut off.
    const base: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_completion_tokens: maxTokens,
      ...(isGptOss ? { reasoning_effort: "low" } : {}),
    };

    for (const withJsonMode of json ? [true, false] : [false]) {
      const body = withJsonMode ? { ...base, response_format: { type: "json_object" } } : base;
      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(45_000),
        });
        if (res.ok) {
          const data = await res.json();
          const text: string = data?.choices?.[0]?.message?.content ?? "";
          if (text.trim()) return text;
          lastErr = `${model}: empty response`;
          continue;
        }
        const errText = (await res.text()).slice(0, 300);
        lastErr = `${model}: HTTP ${res.status} ${errText}`;
        console.warn("[groq]", lastErr);
        if (res.status === 401) throw new Error("Invalid GROQ_API_KEY");
        // 400 while using JSON mode → retry same model without it; otherwise move to next model
        if (res.status === 400 && withJsonMode) continue;
        break;
      } catch (e) {
        if (e instanceof Error && e.message === "Invalid GROQ_API_KEY") throw e;
        lastErr = `${model}: ${String(e).slice(0, 150)}`;
        break;
      }
    }
  }
  throw new Error(`AI request failed (${lastErr})`);
}

function extractJSON(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try { return JSON.parse(cleaned); } catch { /* try to locate object */ }
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI returned no JSON");
  return JSON.parse(m[0]);
}
=======
import Groq from "groq-sdk";
import { StockDetails, ChartDataPoint, AISummary } from "@/lib/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b

// ─── Technical Indicators (calculated from chart data) ────────────────────────
function calcSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const s = closes.slice(-period).reduce((a, b) => a + b, 0);
  return parseFloat((s / period).toFixed(2));
}

function calcEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return parseFloat(ema.toFixed(2));
}

function calcRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
<<<<<<< HEAD
  // Wilder's smoothing over the full history
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  gain /= period; loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (loss === 0) return 100;
  return parseFloat((100 - 100 / (1 + gain / loss)).toFixed(1));
}

function emaSeries(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(ema);
  for (let i = period; i < values.length; i++) { ema = values[i] * k + ema * (1 - k); out.push(ema); }
  return out;
}

function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  const e12 = emaSeries(closes, 12);
  const e26 = emaSeries(closes, 26);
  if (!e12.length || !e26.length) return null;
  // align: e12 starts 14 samples earlier than e26
  const offset = e12.length - e26.length;
  const macdLine = e26.map((v, i) => e12[i + offset] - v);
  const sig = emaSeries(macdLine, 9);
  if (!sig.length) return null;
  const macd = macdLine[macdLine.length - 1];
  const signal = sig[sig.length - 1];
  return { macd: parseFloat(macd.toFixed(2)), signal: parseFloat(signal.toFixed(2)), histogram: parseFloat((macd - signal).toFixed(2)) };
=======
  const changes = closes.slice(-(period + 1)).map((v, i, arr) => i === 0 ? 0 : v - arr[i - 1]).slice(1);
  const avgGain = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
  const avgLoss = changes.filter(c => c < 0).map(Math.abs).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  return parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(1));
}

function calcMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (!ema12 || !ema26) return null;
  const macd = parseFloat((ema12 - ema26).toFixed(2));
  // Simplified signal (would need 9-period EMA of MACD)
  const signal = parseFloat((macd * 0.85).toFixed(2)); // approximation
  return { macd, signal, histogram: parseFloat((macd - signal).toFixed(2)) };
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
}

function calcBollingerBands(closes: number[], period = 20): { upper: number; middle: number; lower: number; width: number } | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  const upper = parseFloat((mean + 2 * stdDev).toFixed(2));
  const lower = parseFloat((mean - 2 * stdDev).toFixed(2));
  const width = parseFloat(((upper - lower) / mean * 100).toFixed(1));
  return { upper, middle: parseFloat(mean.toFixed(2)), lower, width };
}

function calcVolatility(closes: number[]): number | null {
  if (closes.length < 10) return null;
  const slice = closes.slice(-20);
  const returns = slice.slice(1).map((v, i) => Math.log(v / slice[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return parseFloat((Math.sqrt(variance * 252) * 100).toFixed(1));
}

function calcVolumeRatio(volumes: number[]): number | null {
  if (volumes.length < 15) return null;
  const avg = volumes.slice(-31, -1).reduce((a, b) => a + b, 0) / 30;
  const today = volumes[volumes.length - 1];
  return avg ? parseFloat((today / avg).toFixed(2)) : null;
}

function calcMomentum(closes: number[], days = 10): number | null {
  if (closes.length < days + 1) return null;
  const old = closes[closes.length - days - 1];
  const now = closes[closes.length - 1];
  return parseFloat(((now - old) / old * 100).toFixed(2));
}

function calcATR(chart: ChartDataPoint[], period = 14): number | null {
  if (chart.length < period + 1) return null;
  const trs = chart.slice(-period - 1).slice(1).map((d, i) => {
    const prev = chart[chart.length - period - 1 + i];
    return Math.max(d.high - d.low, Math.abs(d.high - prev.close), Math.abs(d.low - prev.close));
  });
  return parseFloat((trs.reduce((a, b) => a + b, 0) / period).toFixed(2));
}

export interface TechnicalIndicators {
  rsi14: number | null;
  sma20: number | null; sma50: number | null; sma200: number | null;
  ema12: number | null; ema26: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  bollinger: { upper: number; middle: number; lower: number; width: number } | null;
  atr14: number | null;
  volatility: number | null;
  volumeRatio: number | null;
  momentum10d: number | null;
  trend: "strong_uptrend" | "uptrend" | "downtrend" | "strong_downtrend" | "sideways" | "unknown";
  bbPosition: "near_upper" | "near_lower" | "middle" | "unknown";
}

export function calcTechnicals(chart: ChartDataPoint[]): TechnicalIndicators {
  if (chart.length < 15) return {
    rsi14: null, sma20: null, sma50: null, sma200: null, ema12: null, ema26: null,
    macd: null, bollinger: null, atr14: null, volatility: null, volumeRatio: null,
    momentum10d: null, trend: "unknown", bbPosition: "unknown"
  };

  const closes  = chart.map(d => d.close);
  const volumes = chart.map(d => d.volume);
  const current = closes[closes.length - 1];

  const rsi14    = calcRSI(closes);
  const sma20    = calcSMA(closes, 20);
  const sma50    = calcSMA(closes, 50);
  const sma200   = calcSMA(closes, 200);
  const ema12    = calcEMA(closes, 12);
  const ema26    = calcEMA(closes, 26);
  const macd     = calcMACD(closes);
  const bollinger = calcBollingerBands(closes, 20);
  const atr14    = calcATR(chart, 14);
  const volatility = calcVolatility(closes);
  const volumeRatio = calcVolumeRatio(volumes);
  const momentum10d = calcMomentum(closes, 10);

  let trend: TechnicalIndicators["trend"] = "unknown";
  if (sma20 && sma50) {
    const aboveBoth = current > sma20 && current > sma50;
    const smaAligned = sma20 > sma50;
    if (aboveBoth && smaAligned && sma200 && current > sma200) trend = "strong_uptrend";
    else if (aboveBoth && smaAligned) trend = "uptrend";
    else if (current < sma20 && current < sma50 && !smaAligned) trend = "strong_downtrend";
    else if (current < sma20 && current < sma50) trend = "downtrend";
    else trend = "sideways";
  }

  let bbPosition: TechnicalIndicators["bbPosition"] = "unknown";
  if (bollinger) {
    const range = bollinger.upper - bollinger.lower;
    if (range > 0) {
      const pos = (current - bollinger.lower) / range;
      if (pos > 0.8) bbPosition = "near_upper";
      else if (pos < 0.2) bbPosition = "near_lower";
      else bbPosition = "middle";
    }
  }

  return { rsi14, sma20, sma50, sma200, ema12, ema26, macd, bollinger, atr14, volatility, volumeRatio, momentum10d, trend, bbPosition };
}

// ─── Main AI Analysis ─────────────────────────────────────────────────────────
export async function getStockAISummary(stock: StockDetails, chart?: ChartDataPoint[]): Promise<AISummary> {
  const t = chart && chart.length >= 20 ? calcTechnicals(chart) : null;
  const current = stock.price;

  const lines: string[] = [
    `STOCK: ${stock.name} (${stock.symbol} · ${stock.exchange})`,
    `DATE: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}`,
    ``,
    `── PRICE ──`,
    `LTP: ₹${current} | Change: ${stock.changePercent > 0 ? "+" : ""}${stock.changePercent}% (₹${stock.change > 0 ? "+" : ""}${stock.change})`,
    `Intraday: ₹${stock.low} – ₹${stock.high} | Open: ₹${stock.open} | PrevClose: ₹${stock.previousClose}`,
    stock.volume > 0 ? `Volume: ${stock.volume.toLocaleString("en-IN")}` : null,
    stock.deliveryPercent ? `Delivery%: ${stock.deliveryPercent}% (>50% = institutional buying, <25% = speculative)` : null,
    stock.totalBuyQty && stock.totalSellQty ? `Buy/Sell Orders: ${stock.totalBuyQty.toLocaleString("en-IN")} / ${stock.totalSellQty.toLocaleString("en-IN")}` : null,
    ``,
    `── VALUATION ──`,
    stock.peRatio    ? `P/E (Trailing): ${stock.peRatio} | Market avg PE: ~22 | ${stock.peRatio < 15 ? "CHEAP vs market" : stock.peRatio > 35 ? "EXPENSIVE vs market" : "Fair value range"}` : `P/E: Not available`,
    stock.pbRatio    ? `P/B: ${stock.pbRatio} | ${stock.pbRatio < 1 ? "Trading BELOW book (potential value)" : stock.pbRatio > 5 ? "Premium valuation" : "Normal range"}` : null,
    stock.eps        ? `EPS (TTM): ₹${stock.eps}` : null,
    stock.bookValue  ? `Book Value: ₹${stock.bookValue}` : null,
    stock.marketCap  ? `Market Cap: ₹${(stock.marketCap / 1e7).toFixed(0)} Cr (${stock.marketCap > 2e12 ? "Large Cap" : stock.marketCap > 2e11 ? "Mid Cap" : "Small Cap"})` : null,
    stock.dividendYield ? `Dividend Yield: ${stock.dividendYield}% (${stock.dividendYield > 3 ? "High yield" : "Low yield"})` : null,
    stock.faceValue  ? `Face Value: ₹${stock.faceValue}` : null,
    ``,
    `── 52-WEEK ──`,
    stock.week52High && stock.week52Low
      ? `Range: ₹${stock.week52Low} – ₹${stock.week52High}`
      : null,
    stock.week52High && stock.week52Low
      ? `Current position: ${Math.round((current - stock.week52Low) / (stock.week52High - stock.week52Low) * 100)}% of 52W range`
      : null,
    stock.week52High ? `Distance from 52W High: ${((current / stock.week52High - 1) * 100).toFixed(1)}% (${current > stock.week52High * 0.95 ? "Near resistance" : (stock.week52Low && current < stock.week52Low * 1.1) ? "Near support" : ""})` : null,
    ``,
    `── SECTOR ──`,
    `Sector: ${stock.sector ?? "?"} | Industry: ${stock.industry ?? "?"}`,
  ].filter(Boolean) as string[];

  if (t) {
    lines.push(``, `── TECHNICAL ANALYSIS ──`);
    if (t.rsi14 !== null) lines.push(`RSI-14: ${t.rsi14} → ${t.rsi14 >= 75 ? "STRONGLY OVERBOUGHT — high reversal risk" : t.rsi14 >= 65 ? "Overbought — caution" : t.rsi14 <= 25 ? "STRONGLY OVERSOLD — potential reversal" : t.rsi14 <= 35 ? "Oversold — watch for bounce" : "Neutral zone"}`);
    if (t.sma20) lines.push(`20-SMA: ₹${t.sma20} | Price ${current > t.sma20 ? "ABOVE (short-term bullish)" : "BELOW (short-term bearish)"}`);
    if (t.sma50) lines.push(`50-SMA: ₹${t.sma50} | Price ${current > t.sma50 ? "ABOVE (medium-term bullish)" : "BELOW (medium-term bearish)"}`);
    if (t.sma200) lines.push(`200-SMA: ₹${t.sma200} | Price ${current > t.sma200 ? "ABOVE — long-term BULL market" : "BELOW — long-term BEAR territory"}`);
    if (t.macd) lines.push(`MACD: ${t.macd.macd} | Signal: ${t.macd.signal} | Histogram: ${t.macd.histogram > 0 ? "+" : ""}${t.macd.histogram} (${t.macd.histogram > 0 ? "bullish momentum" : "bearish momentum"})`);
    if (t.bollinger) lines.push(`Bollinger Bands: ₹${t.bollinger.lower}–₹${t.bollinger.upper} | Width: ${t.bollinger.width}% | Position: ${t.bbPosition} (${t.bbPosition === "near_upper" ? "overbought risk" : t.bbPosition === "near_lower" ? "oversold — bounce possible" : "mid-range"})`);
    if (t.atr14) lines.push(`ATR-14: ₹${t.atr14} (${((t.atr14 / current) * 100).toFixed(1)}% daily range — ${t.atr14 / current > 0.03 ? "high volatility stock" : "stable"})`);
    if (t.momentum10d !== null) lines.push(`10-day Momentum: ${t.momentum10d > 0 ? "+" : ""}${t.momentum10d}%`);
    if (t.volumeRatio !== null) lines.push(`Volume vs 30d avg: ${t.volumeRatio}x (${t.volumeRatio >= 2.5 ? "VERY HIGH — strong conviction move" : t.volumeRatio >= 1.5 ? "Above avg — interest growing" : t.volumeRatio <= 0.4 ? "Very low — weak conviction" : "Normal"})`);
    if (t.volatility !== null) lines.push(`Annualised Volatility: ${t.volatility}% (${t.volatility > 50 ? "Very high risk" : t.volatility > 30 ? "High risk" : t.volatility > 15 ? "Moderate" : "Low volatility"})`);
    lines.push(`Overall Trend: ${t.trend.replace(/_/g, " ").toUpperCase()}`);
  }


<<<<<<< HEAD
  const prompt = `You are an AI assistant that writes concise, data-driven stock analysis notes for Indian equities. Base every statement only on the data provided below; do not invent figures.
=======
  const prompt = `You are Arjun Sharma, a senior equity research analyst at a top-tier Mumbai brokerage with 20 years of experience covering Nifty 50 stocks. You write Bloomberg-quality research notes.
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b

STOCK DATA:
${lines.join("\n")}

TASK: Dual-horizon analysis — SHORT-TERM (1–4 weeks) + LONG-TERM (3–12 months).

SHORT-TERM: Use RSI, MACD histogram, Bollinger position, volume ratio, 20-SMA. Specific entry zone and stop-loss in ₹.
LONG-TERM: Use 200-SMA trend, PE vs Nifty avg (22), delivery%, 52W position. Accumulate or avoid? 12-month target.

RULES: Use specific numbers ("RSI at 67", "PE 24x vs market 22x"). Give concrete ₹ price targets. Skip unavailable metrics silently. Be decisive.

JSON only, no markdown:
{
  "summary": "3-4 sentence executive summary with trend evidence, PE valuation call, volume signal, overall bias",
  "sentiment": "bullish|bearish|neutral",
  "keyPoints": [
    "📈 Trend: [RSI + SMA values and signal]",
    "💰 Valuation: [PE vs Nifty 22, cheap/fair/expensive]",
    "📊 Volume: [ratio + delivery% — institutional or speculative?]",
    "⚠️ Risk: [specific risk with number]",
    "🎯 Signal: [strongest current signal with data point]"
  ],
  "shortTermOutlook": {
    "verdict": "Bullish|Bearish|Neutral",
    "target": "₹XXXX — reason",
    "stopLoss": "₹XXXX — reason",
    "timeframe": "2–3 weeks"
  },
  "longTermOutlook": {
    "verdict": "Accumulate|Avoid|Hold",
    "target": "₹XXXX over 12 months",
    "thesis": "One sentence PE + 200-SMA + sector justification",
    "timeframe": "6–12 months"
  },
  "disclaimer": "Educational analysis only. Not SEBI-registered financial advice."
}`;

<<<<<<< HEAD
  const text = await groqChat(prompt, { temperature: 0.15, maxTokens: 4000, json: true });
  const parsed = extractJSON(text);
=======
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.15,
    max_tokens: 1800,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(text); }
  catch { const m = text.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : {}; }
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b

  return {
    summary:   typeof parsed.summary === "string" ? parsed.summary : "Analysis unavailable.",
    sentiment: (["bullish","bearish","neutral"].includes(parsed.sentiment as string) ? parsed.sentiment : "neutral") as AISummary["sentiment"],
    keyPoints: Array.isArray(parsed.keyPoints) ? (parsed.keyPoints as string[]).slice(0, 5) : [],
    shortTermOutlook: parsed.shortTermOutlook as AISummary["shortTermOutlook"] ?? { verdict: "Neutral", target: "—", stopLoss: "—", timeframe: "2–3 weeks" },
    longTermOutlook:  parsed.longTermOutlook  as AISummary["longTermOutlook"]  ?? { verdict: "Hold",    target: "—", thesis:   "—", timeframe: "6–12 months" },
    disclaimer: typeof parsed.disclaimer === "string" ? parsed.disclaimer : "Not financial advice.",
  };
}

export async function getWatchlistInsight(stocks: { symbol: string; name: string; changePercent: number; price: number }[]): Promise<string> {
  if (!stocks.length) return "Add stocks to your watchlist to get AI insights.";
  const avg = (stocks.reduce((s, x) => s + x.changePercent, 0) / stocks.length).toFixed(2);
  const top = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
<<<<<<< HEAD
  const prompt = `You are an assistant summarising an Indian stock watchlist. Watchlist:\n${stocks.map(s => `${s.symbol}: ₹${s.price} (${s.changePercent > 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`).join(" | ")}\nAvg: ${avg}% | Best: ${top[0]?.symbol} | Worst: ${top[top.length-1]?.symbol}\n\n2-3 sentences: mood, standouts, one actionable. Specific numbers. Plain text only.`;
  const text = await groqChat(prompt, { temperature: 0.3, maxTokens: 1500 });
  return text.trim() || "Unable to generate insight.";
=======
  const prompt = `Indian equity analyst. Watchlist:\n${stocks.map(s => `${s.symbol}: ₹${s.price} (${s.changePercent > 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`).join(" | ")}\nAvg: ${avg}% | Best: ${top[0]?.symbol} | Worst: ${top[top.length-1]?.symbol}\n\n2-3 sentences: mood, standouts, one actionable. Specific numbers. Plain text only.`;
  const c = await groq.chat.completions.create({ model: MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 200 });
  return c.choices[0]?.message?.content?.trim() ?? "Unable to generate insight.";
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
}
