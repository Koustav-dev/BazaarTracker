import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStockDetails, getChartData } from "@/lib/services/stockService";
import { getStockAISummary } from "@/lib/services/groqAI";

export async function GET(req: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const symbol   = req.nextUrl.searchParams.get("symbol") ?? "";
  const exchange = (req.nextUrl.searchParams.get("exchange") ?? "NSE") as "NSE"|"BSE";
  if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  try {
    const [details, chart] = await Promise.allSettled([
      getStockDetails(symbol, exchange),
      getChartData(symbol, exchange, "1y"),
    ]);
    if (details.status === "rejected") throw new Error("Stock data unavailable");
    const chartData = chart.status === "fulfilled" ? chart.value : undefined;
    const data = await getStockAISummary(details.value, chartData);
    return NextResponse.json({ data });
  } catch (e) {
    console.error("[ai/summary]", e);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
