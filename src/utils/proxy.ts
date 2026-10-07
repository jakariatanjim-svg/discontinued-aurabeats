/**
 * Multi–CORS-proxy racing pool.
 * ---------------------------------------------------------------------------
 * Every request is fired through several public CORS proxies in parallel.
 * The first one that returns a valid response wins — the rest are aborted.
 * If all proxies fail the raw URL is tried as a last-resort (works when
 * the target already allows cross-origin requests).
 */

const CORS_PROXIES = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.org/?${encodeURIComponent(u)}`,
];

/** Health tracking — demote proxies that fail repeatedly. */
const health = new Map<number, number>();
function markOk(idx: number) { health.set(idx, 0); }
function markFail(idx: number) { health.set(idx, (health.get(idx) ?? 0) + 1); }
function sortedIndices(): number[] {
  return CORS_PROXIES.map((_, i) => i).sort((a, b) => (health.get(a) ?? 0) - (health.get(b) ?? 0));
}

export interface ProxyFetchOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  json?: boolean;
  headers?: Record<string, string>;
}

/**
 * Race a URL through multiple CORS proxies.
 * Returns the Response from the first proxy that succeeds.
 */
export async function proxyFetch(
  url: string,
  opts: ProxyFetchOptions = {},
): Promise<Response> {
  const { signal, timeoutMs = 8000, headers } = opts;
  const order = sortedIndices();
  const controllers: AbortController[] = [];

  const attempts = order.map((proxyIdx) => {
    const ctrl = new AbortController();
    controllers.push(ctrl);

    if (signal) {
      signal.addEventListener("abort", () => ctrl.abort(), { once: true });
    }

    const proxied = CORS_PROXIES[proxyIdx](url);
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    return fetch(proxied, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", ...headers },
    })
      .then((res) => {
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        markOk(proxyIdx);
        return { res, proxyIdx };
      })
      .catch((err) => {
        clearTimeout(timer);
        markFail(proxyIdx);
        throw err;
      });
  });

  // Also try the raw URL (some endpoints already allow CORS)
  const rawCtrl = new AbortController();
  controllers.push(rawCtrl);
  if (signal) signal.addEventListener("abort", () => rawCtrl.abort(), { once: true });
  const rawTimer = setTimeout(() => rawCtrl.abort(), timeoutMs);

  attempts.push(
    fetch(url, { signal: rawCtrl.signal, headers: { Accept: "application/json", ...headers } })
      .then((res) => {
        clearTimeout(rawTimer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { res, proxyIdx: -1 };
      })
      .catch((err) => {
        clearTimeout(rawTimer);
        throw err;
      }),
  );

  return new Promise<Response>((resolve, reject) => {
    let settled = false;
    let failures = 0;
    const total = attempts.length;

    for (const p of attempts) {
      p.then(({ res }) => {
        if (settled) return;
        settled = true;
        // Abort all other in-flight requests
        controllers.forEach((c) => { try { c.abort(); } catch {} });
        resolve(res);
      }).catch(() => {
        failures++;
        if (failures >= total && !settled) {
          settled = true;
          reject(new Error(`All ${total} proxy attempts failed for ${url}`));
        }
      });
    }
  });
}

/**
 * Convenience: proxy-fetch and parse JSON.
 */
export async function proxyFetchJson<T>(url: string, opts: ProxyFetchOptions = {}): Promise<T> {
  const res = await proxyFetch(url, opts);
  return res.json() as Promise<T>;
}
