import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST ?? "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT ?? "587"),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});

const FROM = process.env.EMAIL_FROM ?? "Bazaar <noreply@bazaar.app>";

function wrap(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
body{font-family:'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;margin:0}
.c{max-width:540px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
.h{background:#0ea5e9;padding:24px 28px}.h h1{color:#fff;margin:0;font-size:18px;font-weight:700;letter-spacing:.5px}
.h p{color:#bae6fd;margin:4px 0 0;font-size:12px}.b{padding:28px}.f{background:#f1f5f9;padding:14px 28px}
.f p{color:#94a3b8;font-size:11px;margin:0}
</style></head><body><div class="c"><div class="h"><h1>BAZAAR</h1><p>Indian Stock Intelligence</p></div>
<div class="b">${body}</div>
<div class="f"><p>© ${new Date().getFullYear()} Bazaar · This is not financial advice</p></div>
</div></body></html>`;
}

export async function sendPriceAlert(to: string, userName: string, stockName: string, symbol: string, exchange: string, condition: "above"|"below", targetPrice: number, currentPrice: number) {
  const word = condition === "above" ? "crossed above" : "dropped below";
  const color = condition === "above" ? "#059669" : "#dc2626";
  const body = `<p style="color:#64748b;margin:0 0 16px">Hello ${userName},</p>
<div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:0 0 20px">
  <p style="font-size:18px;font-weight:700;margin:0">${stockName}</p>
  <p style="color:#64748b;font-size:13px;margin:4px 0 0">${symbol} · ${exchange}</p>
</div>
<p style="font-size:15px;line-height:1.7"><strong>${stockName}</strong> has ${word} your target of <strong>₹${targetPrice.toFixed(2)}</strong>.</p>
<div style="display:flex;gap:24px;margin:20px 0">
  <div><p style="color:#94a3b8;font-size:11px;text-transform:uppercase;margin:0 0 4px">Current</p><p style="font-size:26px;font-weight:700;color:${color};margin:0">₹${currentPrice.toFixed(2)}</p></div>
  <div><p style="color:#94a3b8;font-size:11px;text-transform:uppercase;margin:0 0 4px">Target</p><p style="font-size:26px;font-weight:700;margin:0">₹${targetPrice.toFixed(2)}</p></div>
</div>
<p style="color:#94a3b8;font-size:12px">${new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})} IST</p>`;
  await transporter.sendMail({ from: FROM, to, subject: `🔔 ${symbol} has ${word} ₹${targetPrice}`, html: wrap(body) });
}

export async function sendWelcomeEmail(to: string, name: string) {
  const body = `<p style="font-size:22px;font-weight:700;margin:0 0 8px">Welcome to Bazaar, ${name}! 🎉</p>
<p style="color:#64748b;line-height:1.7;margin:0 0 20px">Your Indian stock intelligence platform is ready. Track NSE & BSE stocks, set price alerts, and get AI-powered market insights — all for free.</p>
<div style="background:#f0f9ff;border-radius:8px;padding:16px">
${["Track unlimited NSE & BSE stocks","Set price alerts with email notifications","AI-powered stock analysis via Groq","Daily market digests every morning"].map(t => `<p style="margin:6px 0;font-size:13px">✦ ${t}</p>`).join("")}
</div>`;
  await transporter.sendMail({ from: FROM, to, subject: "Welcome to Bazaar 🚀", html: wrap(body) });
}
