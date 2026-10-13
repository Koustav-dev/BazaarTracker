import { Scale } from "lucide-react";
export default function Terms() {
  return (
    <div className="page max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
          <Scale size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--txt-primary)" }}>Terms of Service</h1>
          <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
      <div className="card p-6 space-y-5 text-sm leading-relaxed" style={{ color: "var(--txt-secondary)" }}>
        {[
          { title: "1. Acceptance", body: "By accessing or using Bazaar, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform." },
          { title: "2. No Financial Advice", body: "Bazaar provides market data and AI-generated analysis for educational and informational purposes only. Nothing on this platform constitutes financial, investment, or trading advice. Always consult a SEBI-registered financial advisor before making investment decisions." },
          { title: "3. Data Accuracy", body: "We source data from Yahoo Finance and, where available, NSE. While we strive for accuracy, we cannot guarantee real-time completeness. Market data may be delayed by up to 15 minutes during off-peak hours." },
          { title: "4. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials. You must be 18 years or older to create an account." },
          { title: "5. Prohibited Use", body: "You may not use Bazaar to scrape data at scale, conduct automated trading, or engage in any activity that disrupts our services or violates applicable law." },
          { title: "6. Limitation of Liability", body: "Bazaar and its operators are not liable for any financial losses arising from use of this platform. Use of AI analysis and price alerts does not constitute a guarantee of performance." },
          { title: "7. Changes", body: "We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance." },
        ].map(({ title, body }) => (
          <div key={title}>
            <h2 className="font-display font-semibold text-base mb-1.5" style={{ color: "var(--txt-primary)" }}>{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
