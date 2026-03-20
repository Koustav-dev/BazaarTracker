"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, TrendingUp, Mail, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

type Step = "form" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("form");
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [resendIn, setResendIn] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // ── Step 1: Submit form → send OTP ────────────────────────────────────────
  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Registration failed"); return; }
      toast.success("Verification code sent to your email!");
      setStep("otp");
      setResendIn(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  // ── Step 2: OTP input handling ────────────────────────────────────────────
  function handleOtpChange(i: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  async function verifyOTP(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { toast.error("Enter all 6 digits"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        if (res.status === 410 || res.status === 429) {
          // Expired or too many attempts — go back to form
          setStep("form");
          setOtp(["", "", "", "", "", ""]);
        }
        return;
      }
      toast.success("Email verified! Signing you in…");
      const signInRes = await signIn("credentials", {
        email: form.email, password: form.password, redirect: false,
      });
      if (signInRes?.error) {
        toast.success("Account created! Please sign in.");
        router.push("/auth/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  // ── Resend OTP ────────────────────────────────────────────────────────────
  async function resendOTP() {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Failed to resend"); return; }
      toast.success("New code sent!");
      setOtp(["", "", "", "", "", ""]);
      setResendIn(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="card p-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "var(--accent)" }}>
          {step === "otp"
            ? <ShieldCheck size={20} style={{ color: "#000" }} />
            : <TrendingUp size={20} style={{ color: "#000" }} />}
        </div>

        {/* ── STEP 1: Registration form ── */}
        {step === "form" && (
          <>
            <h1 className="font-display font-bold text-2xl mb-1" style={{ color: "var(--txt-primary)" }}>
              Create account
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--txt-muted)" }}>
              Track Indian stocks for free
            </p>

            {/* Google sign-in */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border font-medium text-sm mb-4 transition-all hover:-translate-y-0.5"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--bg-border)", color: "var(--txt-primary)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
              <span className="text-xs" style={{ color: "var(--txt-muted)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--bg-border)" }} />
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="Rahul Sharma" required autoFocus />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={show ? "text" : "password"} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input pr-10" placeholder="Min. 8 characters" required minLength={8} />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "var(--txt-muted)" }}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                Send Verification Code
              </button>
            </form>

            <p className="text-sm text-center mt-5" style={{ color: "var(--txt-muted)" }}>
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium transition-colors" style={{ color: "var(--accent)" }}>
                Sign in
              </Link>
            </p>
            <p className="text-[10px] text-center mt-3" style={{ color: "var(--txt-muted)" }}>Not financial advice.</p>
          </>
        )}

        {/* ── STEP 2: OTP verification ── */}
        {step === "otp" && (
          <>
            <h1 className="font-display font-bold text-2xl mb-1" style={{ color: "var(--txt-primary)" }}>
              Verify your email
            </h1>
            <p className="text-sm mb-1" style={{ color: "var(--txt-muted)" }}>
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-semibold mb-6" style={{ color: "var(--txt-primary)" }}>
              {form.email}
            </p>

            <form onSubmit={verifyOTP} className="space-y-6">
              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold rounded-xl border transition-all outline-none"
                    style={{
                      background: "var(--bg-elevated)",
                      border: digit
                        ? "2px solid var(--accent)"
                        : "1px solid var(--bg-border)",
                      color: "var(--txt-primary)",
                      boxShadow: digit ? "0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent)" : "none",
                    }}
                  />
                ))}
              </div>

              <button type="submit" disabled={loading || otp.join("").length < 6}
                className="btn-primary w-full py-3">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Verify & Create Account
              </button>
            </form>

            {/* Resend */}
            <div className="text-center mt-5">
              {resendIn > 0 ? (
                <p className="text-sm" style={{ color: "var(--txt-muted)" }}>
                  Resend code in <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{resendIn}s</span>
                </p>
              ) : (
                <button onClick={resendOTP} disabled={loading}
                  className="text-sm flex items-center gap-1.5 mx-auto transition-colors"
                  style={{ color: "var(--accent)" }}>
                  <RefreshCw size={12} /> Resend code
                </button>
              )}
            </div>

            {/* Back */}
            <button onClick={() => { setStep("form"); setOtp(["", "", "", "", "", ""]); }}
              className="flex items-center gap-1.5 text-sm mx-auto mt-4 transition-colors"
              style={{ color: "var(--txt-muted)" }}>
              <ArrowLeft size={12} /> Change email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
