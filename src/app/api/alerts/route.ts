import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Alert } from "@/lib/db/models/Alert";

async function auth() {
  const s = await getServerSession(authOptions);
  return s?.user?.id ?? null;
}

export async function GET() {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const data = await Alert.find({ userId: uid }).sort({ createdAt: -1 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { symbol, name, exchange, condition, targetPrice, notifyEmail } = body;
  if (!symbol || !name || !exchange || !condition || !targetPrice)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  await connectDB();
  const alert = await Alert.create({ userId: uid, symbol: symbol.toUpperCase(), name, exchange, condition, targetPrice: parseFloat(targetPrice), notifyEmail: notifyEmail ?? true });
  return NextResponse.json({ data: alert }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await connectDB();
  await Alert.findOneAndDelete({ _id: id, userId: uid });
  return NextResponse.json({ message: "Deleted" });
}

export async function PATCH(req: NextRequest) {
  const uid = await auth();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, status } = await req.json();
  await connectDB();
  const alert = await Alert.findOneAndUpdate({ _id: id, userId: uid }, { status }, { new: true });
  return NextResponse.json({ data: alert });
}
