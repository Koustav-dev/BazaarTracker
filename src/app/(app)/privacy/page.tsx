import { Lock } from "lucide-react";
export default function Privacy() {
  return (
    <div className="page max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--accent) 10%, transparent)" }}>
          <Lock size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--txt-primary)" }}>Privacy Policy</h1>
          <p className="text-xs" style={{ color: "var(--txt-muted)" }}>Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>
      <div className="card p-6 space-y-5 text-sm leading-relaxed" style={{ color: "var(--txt-secondary)" }}>
        {[
          { title: "What we collect", body: "We collect your email address and name during registration, your watchlist stocks, and price alerts you create. We do not collect payment information." },
          { title: "How we use it", body: "Your email is used to send price alert notifications you explicitly request. We do not sell your data or use it for advertising." },
          { title: "Storage", body: "Data is stored in MongoDB Atlas (encrypted at rest). Passwords are hashed with bcrypt and never stored in plain text." },
          { title: "Third-party services", body: "We use Yahoo Finance, NSE and Groq APIs to fetch market data. These are server-side calls — your personal data is never shared with them." },
          { title: "Cookies", body: "We use a single JWT session cookie for authentication (NextAuth.js). We do not use tracking or advertising cookies." },
          { title: "Your rights", body: "You can delete your account and all associated data at any time by contacting us at privacy@bazaar.app." },
          { title: "Contact", body: "For privacy concerns, email privacy@bazaar.app." },
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
