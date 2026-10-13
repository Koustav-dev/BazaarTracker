/**
 * yahooClient.ts
 *
 * Small Yahoo Finance client. Yahoo now rejects most anonymous calls to the
 * quote / quoteSummary endpoints (HTTP 401 "Invalid Crumb"), which is why
 * statistics such as P/E, EPS, P/B and 52-week range stopped loading.
 *
 * The fix is the same session handshake a browser performs:
 *   1. hit fc.yahoo.com to receive the consent/session cookie,
 *   2. exchange that cookie for a "crumb" token at /v1/test/getcrumb,
 *   3. send both cookie and crumb on every data request.
 *
 * The session is cached in memory and refreshed automatically on 401/429.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];
const SESSION_TTL = 50 * 60 * 1000; // 50 minutes

interface Session { cookie: string; crumb: string; at: number }
let session: Session | null = null;
let sessionPromise: Promise<Session | null> | null = null;

function extractCookies(res: Response): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = res.headers as any;
  const list: string[] =
    typeof h.getSetCookie === "function"
      ? h.getSetCookie()
      : (res.headers.get("set-cookie") ?? "").split(/,(?=\s*[A-Za-z0-9_]+=)/).filter(Boolean);
  return list.map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");
}

async function createSession(): Promise<Session | null> {
  try {
    const first = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA, Accept: "*/*" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const cookie = extractCookies(first);
    if (!cookie) return null;

    for (const host of HOSTS) {
      try {
        const r = await fetch(`${host}/v1/test/getcrumb`, {
          headers: { "User-Agent": UA, Accept: "*/*", Cookie: cookie },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) continue;
        const crumb = (await r.text()).trim();
        if (crumb && !crumb.includes("<") && crumb.length < 64) {
          return { cookie, crumb, at: Date.now() };
        }
      } catch { /* try next host */ }
    }
  } catch { /* fall through */ }
  return null;
}

async function getSession(force = false): Promise<Session | null> {
  if (!force && session && Date.now() - session.at < SESSION_TTL) return session;
  if (!sessionPromise) {
    sessionPromise = createSession()
      .then(s => { session = s; return s; })
      .finally(() => { sessionPromise = null; });
  }
  return sessionPromise;
}

/**
 * GET a Yahoo Finance JSON endpoint.
 * @param path   e.g. "/v7/finance/quote"
 * @param params query params (crumb is added automatically when `crumb` is true)
 */
export async function yahooGet<T = unknown>(
  path: string,
  params: Record<string, string> = {},
  opts: { crumb?: boolean; timeoutMs?: number } = {},
): Promise<T> {
  const { crumb = false, timeoutMs = 10000 } = opts;
  let lastErr: unknown = new Error("Yahoo request failed");

  for (let attempt = 0; attempt < 2; attempt++) {
    const sess = crumb || attempt > 0 ? await getSession(attempt > 0) : session;
    for (const host of HOSTS) {
      try {
        const qs = new URLSearchParams(params);
        if (crumb && sess) qs.set("crumb", sess.crumb);
        const res = await fetch(`${host}${path}?${qs.toString()}`, {
          headers: {
            "User-Agent": UA,
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            ...(sess?.cookie ? { Cookie: sess.cookie } : {}),
          },
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
        });
        if (res.status === 401 || res.status === 403) { lastErr = new Error(`Yahoo ${res.status}`); break; } // refresh session
        if (!res.ok) { lastErr = new Error(`Yahoo ${res.status}`); continue; } // try other host
        return (await res.json()) as T;
      } catch (e) { lastErr = e; }
    }
  }
  throw lastErr;
}
