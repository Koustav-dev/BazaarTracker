import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Alert } from "@/lib/db/models/Alert";
import { User } from "@/lib/db/models/User";
import { getStockQuote } from "@/lib/services/stockService";
import { sendPriceAlert } from "@/lib/services/emailService";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alerts = await Alert.find({ status: "active" }) as any[];
    if (!alerts.length) return NextResponse.json({ checked: 0, triggered: 0 });

    const symbols = [...new Set(alerts.map((a) => `${a.symbol}:${a.exchange}`))];
    const priceMap = new Map<string, number>();

    await Promise.allSettled(symbols.map(async (key) => {
      const [symbol, exchange] = (key as string).split(":");
      try {
        const q = await getStockQuote(symbol, exchange as "NSE" | "BSE");
        priceMap.set(key as string, q.price);
      } catch { /* skip */ }
    }));

    let triggered = 0;
    for (const alert of alerts) {
      const price = priceMap.get(`${alert.symbol}:${alert.exchange}`);
      if (!price) continue;
      const hit = alert.condition === "above"
        ? price >= alert.targetPrice
        : price <= alert.targetPrice;
      if (!hit) continue;

      await Alert.findByIdAndUpdate(alert._id, {
        status: "triggered",
        currentPrice: price,
        triggeredAt: new Date(),
      });

      if (alert.notifyEmail) {
        try {
          const user = await User.findById(alert.userId);
          if (user) await sendPriceAlert(
            user.email, user.name, alert.name,
            alert.symbol, alert.exchange,
            alert.condition, alert.targetPrice, price
          );
        } catch { /* email failure is non-fatal */ }
      }
      triggered++;
    }

    return NextResponse.json({ checked: alerts.length, triggered });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
