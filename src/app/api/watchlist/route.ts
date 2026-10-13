import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Watchlist } from "@/lib/db/models/Watchlist";

async function auth() {
  const s = await getServerSession(authOptions);
  return s?.user?.id ?? null;
}

export async function GET() {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const w = await Watchlist.findOne({ userId: uid });
  return NextResponse.json({ data: w?.stocks ?? [] });
}

export async function POST(req: NextRequest) {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { symbol, name, exchange } = await req.json();
  if (!symbol || !name || !exchange) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await connectDB();
  const w = await Watchlist.findOneAndUpdate(
    { userId: uid },
    { $addToSet: { stocks: { symbol: symbol.toUpperCase(), name, exchange, addedAt: new Date() } } },
    { upsert: true, new: true }
  );
  return NextResponse.json({ data: w.stocks, message: "Added" });
}

export async function DELETE(req: NextRequest) {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { symbol, exchange } = await req.json();
  await connectDB();
  const w = await Watchlist.findOneAndUpdate(
    { userId: uid },
    { $pull: { stocks: { symbol: symbol.toUpperCase(), exchange } } },
    { new: true }
  );
  return NextResponse.json({ data: w?.stocks ?? [] });
}
