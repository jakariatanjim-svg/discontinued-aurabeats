/**
 * Radio Browser — open community radio archive.
 * ----------------------------------------------------------------------------
 * A free, community-maintained directory of tens of thousands of live radio
 * streams. No API key, no signup, no rate limit, permissive CORS. We use it as
 * the "Live Radio" section and as an instant fail-over source: if an on-demand
 * track cannot be streamed, the engine can jump to a live open stream so the
 * UI never breaks.
 */

import type { Track } from "@/types";

const MIRRORS: string[] = [
  "https://de1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://nl1.api.radio-browser.info",
  "https://at1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
];

let mirrorOffset = Math.floor(Math.random() * MIRRORS.length);

function mirrorOrder(): string[] {
  return [...MIRRORS.slice(mirrorOffset), ...MIRRORS.slice(0, mirrorOffset)];
}

async function getJson<T>(url: string, signal?: AbortSignal, timeout = 9000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const relay = () => ctrl.abort();
  signal?.addEventListener("abort", relay);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", relay);
  }
}

interface RawStation {
  stationuuid: string;
  name: string;
  url_resolved?: string;
  url?: string;
  homepage?: string;
  favicon?: string;
  tags?: string;
  country?: string;
  countrycode?: string;
  language?: string;
  votes?: number;
  clickcount?: number;
  codec?: string;
  bitrate?: number;
  hls?: number;
  lastcheckok?: number;
}

/** Streams the browser cannot decode natively (HLS / playlist containers). */
const BLOCKED_PATTERN = /\.(m3u8?|pls|asx|m3u_plus)(\?|$)/i;

function normalizeStation(s: RawStation): Track | null {
  const url = (s.url_resolved || s.url || "").trim();
  if (!url) return null;
  if (!/^https:\/\//i.test(url)) return null; // mixed-content safe
  if (s.hls === 1 || BLOCKED_PATTERN.test(url)) return null;
  if (s.lastcheckok === 0) return null;
  const name = (s.name || "Unknown station").replace(/\s+/g, " ").trim();
  const tags = (s.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    id: `radio:${s.stationuuid}`,
    title: name,
    artist: [s.country, s.language].filter(Boolean).join(" • ") || "Live radio",
    artwork: s.favicon?.startsWith("https://") ? s.favicon : "",
    artworkLarge: s.favicon?.startsWith("https://") ? s.favicon : "",
    artistAvatar: "",
    duration: 0,
    genre: tags[0] || s.countrycode || "Live",
    tags,
    source: "radio",
    streamUrl: url,
    fallbackUrls: [url],
    homepage: s.homepage,
    country: s.country,
    bitrate: s.bitrate || undefined,
    codec: s.codec || undefined,
    playCount: s.clickcount,
    favoriteCount: s.votes,
    isLive: true,
  };
}

export interface StationQuery {
  name?: string;
  tag?: string;
  country?: string;
  language?: string;
  limit?: number;
  order?: "votes" | "clickcount" | "name" | "bitrate";
  signal?: AbortSignal;
}

export async function fetchStations(opts: StationQuery = {}): Promise<Track[]> {
  const { name, tag, country, language, limit = 40, order = "clickcount", signal } = opts;
  const params = new URLSearchParams({
    limit: String(limit),
    order,
    reverse: order === "name" ? "false" : "true",
    hidebroken: "true",
    is_https: "true",
  });
  if (name) params.set("name", name);
  if (tag) params.set("tag", tag);
  if (country) params.set("country", country);
  if (language) params.set("language", language);

  let lastError: unknown;
  for (const mirror of mirrorOrder()) {
    try {
      const data = await getJson<RawStation[]>(`${mirror}/json/stations/search?${params.toString()}`, signal);
      mirrorOffset = Math.max(0, MIRRORS.indexOf(mirror));
      const seen = new Set<string>();
      return (Array.isArray(data) ? data : [])
        .map(normalizeStation)
        .filter((t): t is Track => t !== null)
        .filter((t) => (seen.has(t.title.toLowerCase()) ? false : (seen.add(t.title.toLowerCase()), true)));
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Open radio mirrors unreachable");
}

/** Courtesy ping so the open directory knows the stream was used. */
export function reportListen(stationId: string): void {
  const uuid = stationId.replace(/^radio:/, "");
  const mirror = mirrorOrder()[0];
  fetch(`${mirror}/json/url/${uuid}`).catch(() => undefined);
}

export const RADIO_TAG_FEEDS: { label: string; value: string; tint: string }[] = [
  { label: "Top Charts", value: "top", tint: "from-rose-500 to-orange-500" },
  { label: "Chillout", value: "chillout", tint: "from-teal-400 to-emerald-600" },
  { label: "Jazz", value: "jazz", tint: "from-amber-400 to-orange-600" },
  { label: "Classical", value: "classical", tint: "from-slate-400 to-indigo-600" },
  { label: "Rock", value: "rock", tint: "from-red-500 to-neutral-800" },
  { label: "Electronic", value: "electronic", tint: "from-violet-500 to-fuchsia-600" },
  { label: "Hip Hop", value: "hip hop", tint: "from-orange-500 to-rose-700" },
  { label: "Reggae", value: "reggae", tint: "from-lime-400 to-emerald-700" },
  { label: "Blues", value: "blues", tint: "from-blue-500 to-slate-800" },
  { label: "News & Talk", value: "news", tint: "from-cyan-500 to-blue-700" },
  { label: "80s", value: "80s", tint: "from-fuchsia-500 to-purple-700" },
  { label: "Ambient", value: "ambient", tint: "from-sky-400 to-teal-700" },
];

export const RADIO_COUNTRIES: { label: string; code: string }[] = [
  { label: "United States", code: "US" },
  { label: "United Kingdom", code: "GB" },
  { label: "Germany", code: "DE" },
  { label: "France", code: "FR" },
  { label: "Netherlands", code: "NL" },
  { label: "Spain", code: "ES" },
  { label: "Italy", code: "IT" },
  { label: "Brazil", code: "BR" },
  { label: "Japan", code: "JP" },
  { label: "India", code: "IN" },
  { label: "Canada", code: "CA" },
  { label: "Australia", code: "AU" },
];
