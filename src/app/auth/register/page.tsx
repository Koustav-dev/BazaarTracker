"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Registration failed"); return; }
      const signInRes = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (signInRes?.error) { toast.success("Account created! Please sign in."); router.push("/auth/login"); return; }
      toast.success("Welcome to Bazaar!");
      router.push("/dashboard");
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="card p-8 shadow-modal">
        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-glow">
          <TrendingUp size={20} className="text-bg-base" />
        </div>
        <h1 className="font-display font-bold text-2xl text-txt-primary mb-1">Create account</h1>
        <p className="text-sm text-txt-muted mb-6">Track Indian stocks for free</p>

        <form onSubmit={submit} className="space-y-4">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-sm text-txt-muted text-center mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-accent hover:text-accent/80 font-medium transition-colors">Sign in</Link>
        </p>
        <p className="text-[10px] text-txt-muted text-center mt-3">Not financial advice.</p>
      </div>
    </div>
  );
}
