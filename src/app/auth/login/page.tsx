"use client";
import React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...form, redirect: false });
      if (res?.error) { toast.error("Invalid email or password"); return; }
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="w-full max-w-sm animate-fade-up">
      <div className="card p-8 shadow-modal border-bg-border">
        <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center mb-6 shadow-glow">
          <TrendingUp size={20} className="text-bg-base" />
        </div>
        <h1 className="font-display font-bold text-2xl text-txt-primary mb-1">Welcome back</h1>
        <p className="text-sm text-txt-muted mb-6">Sign in to your Bazaar account</p>

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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-sm text-txt-muted text-center mt-5">
          No account?{" "}
          <Link href="/auth/register" className="text-accent hover:text-accent/80 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
