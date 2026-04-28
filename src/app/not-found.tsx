"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 grid-bg opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* 404 Number */}
        <div className="relative mb-8">
          <span 
            className="font-display font-bold text-[180px] sm:text-[240px] leading-none text-transparent bg-clip-text bg-gradient-to-b from-accent/20 to-accent/5"
            style={{ 
              textShadow: '0 0 80px rgba(0,212,170,0.15)',
              WebkitTextStroke: '2px var(--accent)'
            }}
          >
            404
          </span>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
        </div>

        {/* Message */}
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-txt-primary mb-4">
          Page not found
        </h1>
        
        <p className="text-txt-muted max-w-md mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link 
            href="/" 
            className="btn-primary px-6 py-3 gap-2"
          >
            <Home size={16} />
            Go Home
          </Link>
          
          <Link 
            href="/search" 
            className="btn-secondary px-6 py-3 gap-2"
          >
            <Search size={16} />
            Search Stocks
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="btn-ghost px-6 py-3 gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-bg-border">
          <p className="text-xs text-txt-muted mb-4">Popular pages</p>
          <div className="flex items-center gap-4 flex-wrap justify-center text-sm">
            <Link 
              href="/dashboard" 
              className="text-accent hover:underline underline-offset-4"
            >
              Dashboard
            </Link>
            <Link 
              href="/watchlist" 
              className="text-accent hover:underline underline-offset-4"
            >
              Watchlist
            </Link>
            <Link 
              href="/alerts" 
              className="text-accent hover:underline underline-offset-4"
            >
              Price Alerts
            </Link>
            <Link 
              href="/stock/RELIANCE" 
              className="text-accent hover:underline underline-offset-4"
            >
              Sample Stock
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-bg-border py-6 text-center">
        <p className="text-xs text-txt-muted">
          Not financial advice. Data from NSE & Yahoo Finance.
        </p>
      </footer>
    </div>
  );
}