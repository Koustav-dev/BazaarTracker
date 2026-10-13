"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm]       = useState({ email: "", password: "" });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...form, redirect: false });
      if (res?.error) {
        toast.error("Invalid email or password");
        return;
      }
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  async function googleSignIn() {
    setGLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="card p-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "var(--accent)" }}>
          <TrendingUp size={20} style={{ color: "#000" }} />
        </div>

        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: "var(--txt-primary)" }}>
          Welcome back
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--txt-muted)" }}>
          Sign in to your Bazaar account
        </p>

        {/* Google sign-in */}
        <button
          onClick={googleSignIn}
          disabled={gLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border font-medium text-sm mb-4 transition-all hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-primary)" }}>
          {gLoading
            ? <Loader2 size={16} className="animate-spin" />
            : <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
          }
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
          <span className="text-xs" style={{ color: "var(--txt-muted)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input" placeholder="you@example.com" required autoFocus />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="input pr-10" placeholder="Your password" required />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "var(--txt-muted)" }}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-sm text-center mt-5" style={{ color: "var(--txt-muted)" }}>
          No account?{" "}
          <Link href="/auth/register" className="font-medium transition-colors" style={{ color: "var(--accent)" }}>
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
