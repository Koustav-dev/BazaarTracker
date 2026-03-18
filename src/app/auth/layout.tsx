import React from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-base grid-bg flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/3 rounded-full blur-3xl pointer-events-none" />

      <header className="p-6 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 w-fit group">
          <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center group-hover:shadow-glow transition-all">
            <TrendingUp size={15} className="text-bg-base" />
          </div>
          <span className="font-display font-bold text-txt-primary text-lg">Bazaar</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 pb-12 relative z-10">
        {children}
      </div>
    </div>
  );
}
