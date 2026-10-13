import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/services/stockService";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 1) return NextResponse.json({ data: [] });
  try {
    const data = await searchStocks(q);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
