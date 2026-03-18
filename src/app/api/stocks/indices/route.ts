import { NextResponse } from "next/server";
import { getMarketIndices } from "@/lib/services/stockService";

export async function GET() {
  try {
    const data = await getMarketIndices();
    return NextResponse.json({ data }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch indices" }, { status: 500 });
  }
}
