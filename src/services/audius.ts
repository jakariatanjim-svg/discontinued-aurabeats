/**
 * Audius open music network client.
 * ----------------------------------------------------------------------------
 * Audius is a fully open, decentralised music catalogue. Its public discovery
 * nodes expose a REST API that requires **no API key, no account and no
 * payment**, sends permissive CORS headers and returns direct streamable
 * audio URLs (MP3) plus real artwork in three resolutions.
 *
 * We never hardcode songs: everything is requested live at runtime from a pool
 * of mirrors. If a mirror fails we silently rotate to the next one, and every
 * track carries a list of alternative stream endpoints used by the player's
 * automatic fail-over engine.
 */

import type { Artist, Track } from "@/types";

const APP_NAME = "AuraBeats";

/** Public discovery-node mirrors (rotated + health-tracked at runtime). */
const HOSTS: string[] = [
  "https://discoveryprovider.audius.co",
  "https://discoveryprovider2.audius.co",
  "https://discoveryprovider3.audius.co",
  "https://api.audius.co",
];

let preferredIndex = Math.floor(Math.random() * HOSTS.length);
const unhealthy = new Set<string>();

function hostOrder(): string[] {
  const healthy = HOSTS.filter((h) => !unhealthy.has(h));
  if (healthy.length === 0) return [...HOSTS];
  const start = preferredIndex % healthy.length;
  return [...healthy.slice(start), ...healthy.slice(0, start)];
}

export function activeHost(): string {
  return hostOrder()[0];
}

export function resetHostHealth(): void {
  unhealthy.clear();
  preferredIndex = Math.floor(Math.random() * HOSTS.length);
}

function buildUrl(host: string, path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${host.replace(/\/$/, "")}${path}`);
  url.searchParams.set("app_name", APP_NAME);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

/** Direct-play endpoints for a track, ordered primary -> mirrors. */
export function streamCandidates(id: string): string[] {
  return hostOrder().map((h) => buildUrl(h, `/v1/tracks/${id}/stream`));
}

function withTimeout(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  return {
    signal: ctrl.signal,
    cancel: () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    },
  };
}

async function getJson<T>(url: string, signal?: AbortSignal, timeout = 9000): Promise<T> {
  const t = withTimeout(signal, timeout);
  try {
    const res = await fetch(url, { signal: t.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    t.cancel();
  }
}

/** GET an Audius endpoint, transparently failing over across mirrors. */
async function audiusGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T> {
  const order = hostOrder();
  let lastError: unknown;
  for (const host of order) {
    try {
      const json = await getJson<{ data: T }>(buildUrl(host, path, params), signal);
      preferredIndex = Math.max(0, HOSTS.indexOf(host));
      unhealthy.delete(host);
      return json.data;
    } catch (err) {
      if (signal?.aborted) throw err;
      lastError = err;
      unhealthy.add(host);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All open music mirrors are unreachable");
}

/* ------------------------------ normalisers ------------------------------ */

interface RawImage {
  "150x150"?: string;
  "480x480"?: string;
  "1000x1000"?: string;
}

interface RawTrack {
  id: string;
  title: string;
  duration: number;
  genre?: string | null;
  mood?: string | null;
  tags?: string | null;
  release_date?: string | null;
  play_count?: number;
  favorite_count?: number;
  repost_count?: number;
  is_streamable?: boolean;
  is_delete?: boolean;
  is_available?: boolean;
  artwork?: RawImage | null;
  user?: {
    name?: string;
    handle?: string;
    is_verified?: boolean;
    profile_picture?: RawImage | null;
  } | null;
}

export function artUrl(img?: RawImage | null, size: keyof RawImage = "480x480"): string {
  return img?.[size] ?? img?.["480x480"] ?? img?.["150x150"] ?? img?.["1000x1000"] ?? "";
}

export function normalizeTrack(raw: RawTrack): Track {
  const id = String(raw.id);
  return {
    id: `audius:${id}`,
    title: (raw.title || "Untitled").trim(),
    artist: raw.user?.name?.trim() || raw.user?.handle?.trim() || "Unknown artist",
    artistHandle: raw.user?.handle,
    artistAvatar: artUrl(raw.user?.profile_picture, "150x150"),
    artwork: artUrl(raw.artwork, "480x480"),
    artworkLarge: artUrl(raw.artwork, "1000x1000"),
    duration: Number(raw.duration) || 0,
    genre: raw.genre || undefined,
    mood: raw.mood || undefined,
    tags: (raw.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6),
    source: "audius",
    streamUrl: streamCandidates(id)[0],
    fallbackUrls: streamCandidates(id),
    playCount: raw.play_count,
    favoriteCount: raw.favorite_count,
    releaseDate: raw.release_date || undefined,
    bitrate: 320,
    codec: "MP3",
    isLive: false,
  };
}

function normalizeTracks(list: RawTrack[] | undefined | null): Track[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((t) => t && t.id && !t.is_delete && t.is_available !== false && t.is_streamable !== false)
    .map(normalizeTrack);
}

interface RawUser {
  id: string;
  name?: string;
  handle?: string;
  is_verified?: boolean;
  follower_count?: number;
  track_count?: number;
  profile_picture?: RawImage | null;
}

export function normalizeArtist(raw: RawUser): Artist {
  return {
    id: `audius-user:${raw.id}`,
    name: raw.name?.trim() || raw.handle || "Unknown artist",
    handle: raw.handle || "",
    avatar: artUrl(raw.profile_picture, "480x480"),
    followers: raw.follower_count ?? 0,
    verified: Boolean(raw.is_verified),
    trackCount: raw.track_count ?? 0,
  };
}

/* -------------------------------- endpoints ------------------------------- */

export type TimeWindow = "week" | "month" | "year" | "allTime";

export interface FeedQuery {
  limit?: number;
  offset?: number;
  genre?: string;
  mood?: string;
  time?: TimeWindow;
  signal?: AbortSignal;
}

export async function fetchTrending(opts: FeedQuery = {}): Promise<Track[]> {
  const { limit = 30, offset = 0, genre, mood, time = "week", signal } = opts;
  const data = await audiusGet<RawTrack[]>("/v1/tracks/trending", { limit, offset, genre, mood, time }, signal);
  return normalizeTracks(data);
}

export async function fetchUnderground(opts: FeedQuery = {}): Promise<Track[]> {
  const { limit = 30, offset = 0, signal } = opts;
  const data = await audiusGet<RawTrack[]>("/v1/tracks/trending/underground", { limit, offset, time: "week" }, signal);
  return normalizeTracks(data);
}

export async function fetchTracksByGenre(genre: string, opts: FeedQuery = {}): Promise<Track[]> {
  const trending = await fetchTrending({ ...opts, genre }).catch(() => [] as Track[]);
  if (trending.length >= 8) return trending;
  const searched = await searchTracks(genre, { limit: opts.limit ?? 30, signal: opts.signal }).catch(() => [] as Track[]);
  const merged = [...trending, ...searched];
  const seen = new Set<string>();
  return merged.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}

export async function searchTracks(
  query: string,
  opts: { limit?: number; offset?: number; signal?: AbortSignal; genre?: string; mood?: string } = {},
): Promise<Track[]> {
  const { limit = 30, offset = 0, signal, genre, mood } = opts;
  if (!query.trim() && !genre && !mood) return [];
  const data = await audiusGet<RawTrack[]>("/v1/tracks/search", { query, limit, offset, genre, mood }, signal);
  return normalizeTracks(data);
}

export async function searchArtists(
  query: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<Artist[]> {
  const { limit = 12, signal } = opts;
  if (!query.trim()) return [];
  const data = await audiusGet<RawUser[]>("/v1/users/search", { query, limit }, signal);
  return (Array.isArray(data) ? data : []).map(normalizeArtist);
}

export async function fetchArtistByHandle(handle: string, signal?: AbortSignal): Promise<Artist | null> {
  const data = await audiusGet<RawUser>(`/v1/users/handle/${encodeURIComponent(handle)}`, {}, signal);
  return data ? normalizeArtist(data) : null;
}

export async function fetchArtistTracks(handle: string, opts: { limit?: number; signal?: AbortSignal } = {}): Promise<Track[]> {
  const { limit = 40, signal } = opts;
  const data = await audiusGet<RawTrack[]>(
    `/v1/users/handle/${encodeURIComponent(handle)}/tracks`,
    { limit, sort: "plays" },
    signal,
  );
  return normalizeTracks(data);
}

export async function fetchSimilarTracks(id: string, opts: { limit?: number; signal?: AbortSignal } = {}): Promise<Track[]> {
  const { limit = 20, signal } = opts;
  const clean = id.replace(/^audius:/, "");
  const data = await audiusGet<RawTrack[]>(`/v1/tracks/${clean}/similar`, { limit }, signal);
  return normalizeTracks(data);
}
