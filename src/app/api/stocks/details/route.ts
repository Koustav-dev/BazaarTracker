import { NextRequest, NextResponse } from "next/server";
import { getStockDetails } from "@/lib/services/stockService";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const exchange = (req.nextUrl.searchParams.get("exchange") ?? "NSE") as "NSE"|"BSE";
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  try {
    const data = await getStockDetails(symbol, exchange);
    return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=90" } });
  } catch (e) {
    console.error("[details]", e);
    return NextResponse.json({ error: "Failed to fetch details" }, { status: 500 });
  }
}
