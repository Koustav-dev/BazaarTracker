import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/services/stockService";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const exchange = (req.nextUrl.searchParams.get("exchange") ?? "NSE") as "NSE"|"BSE";
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  try {
    const data = await getStockQuote(symbol, exchange);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
