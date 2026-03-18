import { NextRequest, NextResponse } from "next/server";
import { getChartData } from "@/lib/services/stockService";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const exchange = (req.nextUrl.searchParams.get("exchange") ?? "NSE") as "NSE"|"BSE";
  const range = (req.nextUrl.searchParams.get("range") ?? "1mo") as "1d"|"5d"|"1mo"|"3mo"|"6mo"|"1y"|"5y";
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  try {
    const data = await getChartData(symbol, exchange, range);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch chart" }, { status: 500 });
  }
}
