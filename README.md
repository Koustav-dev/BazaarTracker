# Bazaar — Indian Stock Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/MongoDB-4.1-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D2?style=for-the-badge&logo=tailwind-css" alt="Tailwind">
</p>

Bazaar is a modern, full-stack stock tracking platform for Indian markets (NSE & BSE) with AI-powered analysis, real-time prices, technical indicators, and smart price alerts.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
<<<<<<< HEAD
| **Real-time Prices** | Live NSE & BSE stock data from Yahoo Finance, enriched with NSE delivery %/VWAP when reachable |
| **Technical Analysis** | RSI, MACD, Bollinger Bands, SMA (20/50/200), EMA, ATR, Volatility calculations |
| **AI Research Notes** | AI (Groq, GPT-OSS 120B) generates directional views with price targets, stop-loss, and thesis |
=======
| **Real-time Prices** | Live NSE & BSE stock data from official NSE API with Yahoo Finance fallback |
| **Technical Analysis** | RSI, MACD, Bollinger Bands, SMA (20/50/200), EMA, ATR, Volatility calculations |
| **AI Research Notes** | Groq AI generates directional views with price targets, stop-loss, and thesis |
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
| **Price Alerts** | Email notifications when target prices are hit (above/below conditions) |
| **Watchlist** | Personal watchlist with live price updates |
| **Market Indices** | Live NIFTY 50, SENSEX, NIFTY BANK tracking |
| **Stock Search** | Fast autocomplete search across 100+ stocks |
| **Dark/Light Theme** | Beautiful warm parchment (light) and neon purple (dark) themes |

---

## 📁 Project Structure

```
BazaarTracker/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (app)/                  # Authenticated routes (grouped)
│   │   │   ├── alerts/             # Price alerts page
│   │   │   ├── dashboard/          # Main dashboard
│   │   │   ├── search/             # Stock search page
│   │   │   ├── stock/[symbol]/     # Individual stock detail page
│   │   │   ├── watchlist/          # User watchlist page
│   │   │   ├── disclaimer/         # Disclaimer page
│   │   │   ├── privacy/            # Privacy policy page
│   │   │   └── terms/              # Terms of service page
│   │   ├── api/                    # API Routes
│   │   │   ├── ai/
│   │   │   │   ├── insight/        # AI insight endpoint
│   │   │   │   └── summary/        # AI summary endpoint
│   │   │   ├── alerts/             # Price alerts CRUD
│   │   │   ├── auth/               # NextAuth.js routes
│   │   │   ├── cron/               # Cron jobs (alert checking)
│   │   │   ├── stocks/             # Stock data endpoints
│   │   │   └── watchlist/          # Watchlist CRUD
│   │   ├── auth/                   # Auth pages (login/register)
│   │   ├── globals.css             # Global styles + CSS variables
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Landing page
│   │   └── providers.tsx           # React Query + Session providers
│   ├── components/
│   │   └── stocks/                 # Stock-related UI components
│   │       ├── AISummaryPanel.tsx  # AI analysis display
│   │       ├── CreateAlertModal.tsx
│   │       ├── IndexModal.tsx
│   │       ├── NewsWidget.tsx
│   │       ├── PriceChart.tsx      # Recharts price chart
│   │       ├── StockCard.tsx
│   │       ├── StockSearch.tsx
│   │       └── WatchlistButton.tsx
│   ├── lib/
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── db/
│   │   │   ├── connect.ts          # MongoDB connection (singleton)
│   │   │   └── models/             # Mongoose models
│   │   │       ├── Alert.ts
│   │   │       ├── OTP.ts
│   │   │       ├── User.ts
│   │   │       └── Watchlist.ts
│   │   ├── services/
│   │   │   ├── emailService.ts     # Nodemailer email sending
│   │   │   ├── fundamentalsService.ts
│   │   │   ├── groqAI.ts           # AI analysis + technical indicators
│   │   │   └── stockService.ts     # NSE/Yahoo data fetching
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   └── utils/
│   │       └── index.ts            # Helper functions
│   └── types/
│       └── next-auth.d.ts          # NextAuth type extensions
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5
- **UI**: React 18, Tailwind CSS 3.4
- **State Management**: Zustand, TanStack React Query
- **Database**: MongoDB 4.1 with Mongoose 8.4
- **Authentication**: NextAuth.js 4.24 (Credentials + Google OAuth)
<<<<<<< HEAD
- **AI**: Groq API (`openai/gpt-oss-120b`, configurable via `GROQ_MODEL`)
=======
- **AI**: Groq SDK (Llama 3.3 70B)
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
- **Charts**: Recharts
- **Email**: Nodemailer
- **Fonts**: Sora, DM Sans, JetBrains Mono

---

## ⚙️ Environment Setup

### 1. Clone & Install

```bash
git clone <repository-url>
cd BazaarTracker
npm install
```

### 2. Create Environment File

Create a `.env.local` file in the project root with the following variables:

```env
# ===================
# DATABASE
# ===================
MONGODB_URI=mongodb://localhost:27017/bazaar

# ===================
# AUTHENTICATION
# ===================
NEXTAUTH_SECRET=your-super-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ===================
# EMAIL (SMTP)
# ===================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Bazaar <noreply@bazaar.app>

# ===================
# AI SERVICE
# ===================
GROQ_API_KEY=your-groq-api-key
<<<<<<< HEAD
# Optional: override the model (default openai/gpt-oss-120b)
# GROQ_MODEL=openai/gpt-oss-120b

# Optional
# FMP_API_KEY=...        # extra company profile data
# NEWSDATA_API_KEY=...   # better news source
# CRON_SECRET=...        # protects /api/cron/check-alerts
=======
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b
```

### 3. Get API Keys

| Service | How to Get |
|---------|------------|
| **MongoDB** | Use local MongoDB or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier |
| **Google OAuth** | Create project at [Google Cloud Console](https://console.cloud.google.com) → APIs → Credentials |
| **Groq AI** | Get free API key at [groq.com](https://groq.com) |
| **Gmail App Password** | Enable 2FA → App Passwords in Google Account security settings |

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints

### Stock Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stocks/quote` | GET | Get stock quote (symbol, price, change) |
| `/api/stocks/details` | GET | Get detailed stock info (PE, market cap, etc.) |
| `/api/stocks/chart` | GET | Get historical chart data |
| `/api/stocks/indices` | GET | Get market indices (NIFTY 50, SENSEX) |
| `/api/stocks/news` | GET | Get stock news |
| `/api/stocks/search` | GET | Search stocks by symbol/name |

### AI Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/summary` | GET | Get AI-generated stock analysis (requires auth) |
| `/api/ai/insight` | GET | Get AI insight for a stock |

### User Features

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | GET/POST/DELETE/PATCH | Manage price alerts |
| `/api/watchlist` | GET/POST/DELETE | Manage watchlist |
| `/api/auth/*` | ALL | Authentication routes |

---

## 🎨 Theme System

The app uses CSS variables for theming with two modes:

### Light Theme (Default)
- **Background**: Cream parchment (#FFFDF1)
- **Cards**: Pure white (#FFFFFF)
- **Accent**: Saffron orange (#FF9644)
- **Up/Positive**: Forest green (#2D7A3A)
- **Down/Negative**: Deep red (#C0392B)

### Dark Theme
- **Background**: Pure black (#000000)
- **Cards**: Near-black (#0D0D0D)
- **Accent**: Electric purple (#9929EA)
- **Up/Positive**: Neon green (#00E676)
- **Down/Negative**: Hot pink (#FF5FCF)

Toggle between themes using the class `dark` on the `<html>` element.

---

## 🔧 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## 🚀 Suggestions for New Features

### High Priority
1. **Portfolio Tracking** - Track holdings with P&L calculation
2. **Advanced Charts** - Add candlestick charts, multiple timeframes (1D, 1W, 1M, 3M, 5Y)
3. **Stock Comparison** - Compare multiple stocks side-by-side
4. **Market News Feed** - Aggregated news from multiple sources
5. **Push Notifications** - Browser push notifications for alerts

### Medium Priority
6. **Options Data** - NSE options chain data
7. **Fundamental Analysis** - Quarterly results, balance sheet, cash flow
8. **Sector Analysis** - Sector-wise performance breakdown
9. **IPO Calendar** - Upcoming IPOs tracking
10. **Stock Screener** - Filter stocks by PE, market cap, volume

### Lower Priority
11. **Social Features** - Share insights, follow other investors
12. **Paper Trading** - Virtual trading with fake money
13. **Mobile App** - React Native or Expo mobile app
14. **Widget Support** - iOS/Android home screen widgets
15. **API for Developers** - Public API for third-party integrations
16. **Multi-language Support** - Hindi, regional languages
17. **Advanced AI** - Chat with AI about stocks, natural language queries
18. **Real-time WebSocket** - Live price updates via WebSocket instead of polling

---

## 📄 License

<<<<<<< HEAD
MIT License - See [LICENSE](LICENSE) for details. Market data is provided by third parties (Yahoo Finance, NSE) under their own terms.
=======
MIT License - See [LICENSE](LICENSE) for details.
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b

---

## ⚠️ Disclaimer

<<<<<<< HEAD
This platform is for educational and informational purposes only. Stock data is sourced from Yahoo Finance and NSE. **Not financial advice** — always do your own research before making investment decisions.
=======
This platform is for educational and informational purposes only. Stock data is sourced from NSE and Yahoo Finance. **Not financial advice** — always do your own research before making investment decisions.
>>>>>>> 1fa8d5008fc6d81fb2d1cf7db82b1239c1087b5b

---

Built with ❤️ for Indian investors