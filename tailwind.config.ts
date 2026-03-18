import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body:    ["var(--font-body)"],
        mono:    ["var(--font-mono)"],
      },
      colors: {
        "bg-base":     "var(--bg-base)",
        "bg-card":     "var(--bg-card)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-border":   "var(--bg-border)",
        "bg-hover":    "var(--bg-hover)",
        "txt-primary": "var(--txt-primary)",
        "txt-secondary":"var(--txt-secondary)",
        "txt-muted":   "var(--txt-muted)",
        accent:        "var(--accent)",
        up:            "var(--up)",
        down:          "var(--down)",
        warn:          "var(--warn)",
      },
    },
  },
  plugins: [],
} satisfies Config;
