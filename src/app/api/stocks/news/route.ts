import { NextRequest, NextResponse } from "next/server";

interface Article {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  image: string | null;
}

// Parse RSS/Atom XML and return items
function parseRSS(xml: string, sourceName: string): Article[] {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.map(m => {
    const c = m[1];
    const get = (tag: string) =>
      c.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`))?.[1]?.trim() ?? "";
    const title = get("title");
    const link  = get("link") || c.match(/<link\s+href="([^"]+)"/)?.[1] || "";
    const date  = get("pubDate") || get("published") || get("dc:date") || "";
    const desc  = get("description").replace(/<[^>]+>/g, "").slice(0, 180);
    return { title, description: desc, url: link, publishedAt: date, source: sourceName, image: null };
  }).filter(a => a.title && a.url);
}

async function fetchRSS(url: string, source: string, timeoutMs = 6000): Promise<Article[]> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return [];
    const text = await res.text();
    return parseRSS(text, source);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "").toUpperCase();
  const companyName = req.nextUrl.searchParams.get("name") ?? symbol;

  // ── Priority 1: newsdata.io (best quality, 200 req/day free) ──────────────
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (apiKey) {
    try {
      const q = symbol ? `${symbol} ${companyName} stock NSE` : "NSE BSE India stock market";
      const res = await fetch(
        `https://newsdata.io/api/1/news?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&country=in&category=business&size=6`,
        { signal: AbortSignal.timeout(7000) }
      );
      if (res.ok) {
        const data = await res.json();
        const articles = (data.results ?? []).slice(0, 6).map((a: Record<string, unknown>) => ({
          title:       a.title,
          description: (a.description ?? "") as string,
          url:         a.link,
          publishedAt: a.pubDate,
          source:      a.source_id,
          image:       a.image_url ?? null,
        })) as Article[];
        if (articles.length > 0) return NextResponse.json({ data: articles });
      }
    } catch { /* fall through */ }
  }

  // ── Priority 2: Google News RSS (completely free, no key, very reliable) ──
  // Google News RSS works for any search query and always has fresh Indian stock news
  const googleQuery = symbol
    ? `${symbol} ${companyName} NSE stock`
    : "NSE BSE India stock market";
  const googleRSS = `https://news.google.com/rss/search?q=${encodeURIComponent(googleQuery)}&hl=en-IN&gl=IN&ceid=IN:en`;

  // ── Priority 3: Economic Times Markets RSS (India-specific, very relevant) ──
  const etRSS = symbol
    ? `https://economictimes.indiatimes.com/markets/stocks/news/${symbol.toLowerCase()}/rssfeeds/news.cms`
    : "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms";

  // ── Priority 4: Moneycontrol RSS ──
  const mcRSS = "https://www.moneycontrol.com/rss/marketsindia.xml";

  // Fetch all sources in parallel, use first one that returns results
  const [google, et, mc] = await Promise.all([
    fetchRSS(googleRSS, "Google News"),
    fetchRSS(etRSS, "Economic Times"),
    fetchRSS(mcRSS, "Moneycontrol"),
  ]);

  // Merge: Google News first (most relevant), then ET, then MC
  // Deduplicate by title
  const seen = new Set<string>();
  const merged: Article[] = [];
  for (const a of [...google, ...et, ...mc]) {
    const key = a.title.slice(0, 50).toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push(a); }
    if (merged.length >= 6) break;
  }

  return NextResponse.json({ data: merged });
}
