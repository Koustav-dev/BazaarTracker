export interface StockQuote {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  currency: string;
  timestamp: number;
}

export interface StockDetails extends StockQuote {
  peRatio?: number;
  pbRatio?: number;
  eps?: number;
  week52High?: number;
  week52Low?: number;
  dividendYield?: number;
  bookValue?: number;
  sector?: string;
  industry?: string;
  description?: string;
  employees?: number;
  ipoDate?: string;
  vwap?: number;
  marketCapLabel?: string; // 'LARGE CAP' | 'MID CAP' | 'SMALL CAP'
  website?: string;
  faceValue?: number;
  deliveryPercent?: number;
  totalBuyQty?: number;
  totalSellQty?: number;
  dataSource?: "nse" | "yahoo" | "mixed" | "nse+yahoo" | "nse+fmp" | "fmp";
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  type: string;
  sector?: string;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface AlertPayload {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  condition: "above" | "below";
  targetPrice: number;
  notifyEmail: boolean;
}

export interface WatchlistStock {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  addedAt: string;
}

export interface AISummary {
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyPoints: string[];
  shortTermOutlook: { verdict: string; target: string; stopLoss: string; timeframe: string; };
  longTermOutlook:  { verdict: string; target: string; thesis: string; timeframe: string; };
  disclaimer: string;
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface Alert {
  _id: string;
  symbol: string;
  name: string;
  exchange: "NSE"|"BSE";
  condition: "above"|"below";
  targetPrice: number;
  notifyEmail: boolean;
  status: "active"|"triggered";
  triggeredAt?: string;
  currentPrice?: number;
  createdAt?: string;
}
