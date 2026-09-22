/**
 * Unified live catalogue.
 * ----------------------------------------------------------------------------
 * AuraBeats never uses a paid/official commercial music API and never plays
 * 30-second previews. The feeds below resolve to full-length audio from:
 *
 *   • Internet Archive  — CC / public-domain music, direct MP3, multi-node
 *   • Audius            — open decentralised artist network, direct MP3
 *   • Invidious mirrors — YouTube/YouTube Music mirror search + proxied audio
 *   • Radio Browser     — open live radio directory (Radio section only)
 *
 * Each helper races/merges the providers and degrades gracefully: if one
 * network is unreachable the feed still returns whatever the others produced,
 * so the UI is never empty and never breaks.
 */

import * as archive from "@/services/archive";
import * as audius from "@/services/audius";
import * as jiosaavn from "@/services/jiosaavn";
import * as jamendo from "@/services/jamendo";
import * as youtube from "@/services/youtube";
import { shuffleArray } from "@/utils/format";
import type { Track } from "@/types";

function normalizeText(value: string): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const t of tracks) {
    const key = `${normalizeText(t.title)}|${normalizeText(t.artist)}`;
    if (seen.has(t.id) || seen.has(key)) continue;
    seen.add(t.id);
    seen.add(key);
    out.push(t);
  }
  return out;
}

function interleaveMany(lists: Track[][]): Track[] {
  const out: Track[] = [];
  const max = Math.max(...lists.map((list) => list.length), 0);
  for (let i = 0; i < max; i += 1) {
    for (const list of lists) {
      if (list[i]) out.push(list[i]);
    }
  }
  return out;
}

function scoreTrack(query: string, track: Track): number {
  const q = normalizeText(query);
  if (!q) return 0;

  const title = normalizeText(track.title);
  const artist = normalizeText(track.artist);
  const combined = `${title} ${artist}`.trim();
  const tokens = q.split(" ").filter(Boolean);

  let score = 0;
  if (title === q) score += 220;
  if (combined === q) score += 190;
  if (title.startsWith(q)) score += 140;
  if (artist.startsWith(q)) score += 90;
  if (combined.startsWith(q)) score += 75;
  if (title.includes(q)) score += 60;
  if (combined.includes(q)) score += 35;

  score += tokens.reduce((acc, token) => acc + (title.includes(token) ? 18 : 0) + (artist.includes(token) ? 10 : 0), 0);

  if (track.source === "jiosaavn") score += 35; // Pure music database
  if (track.source === "youtube") score += 25;  // YouTube Music mirror
  if (track.source === "jamendo") score += 20;
  if (track.source === "audius") score += 15;
  if (track.source === "archive") score += 8;

  if (track.duration > 0 && track.duration <= 7 * 60) score += 8;
  if (track.duration > 16 * 60) score -= 18;
  if (/lyrics|slowed|reverb|nightcore|bass boosted|8d/i.test(track.title)) score -= 20;
  if (/full album|mix|playlist|compilation|hours?/i.test(track.title)) score -= 30;

  return score;
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeText(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function settle<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

export interface CatalogQuery {
  limit?: number;
  signal?: AbortSignal;
}

/** Trending full tracks across all active databases. */
export async function fetchPopular(opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 34, signal } = opts;
  const [js, yt, jam, au, ia] = await Promise.all([
    settle(jiosaavn.fetchTrending(Math.ceil(limit / 2)), [] as Track[]),
    settle(youtube.searchTracks("popular", 10), [] as Track[]),
    settle(jamendo.fetchPopular(Math.ceil(limit / 3)), [] as Track[]),
    settle(audius.fetchTrending({ limit: 10, signal }), [] as Track[]),
    settle(
      archive
        .searchAlbums({ collection: "netlabels", rows: 12, sort: "downloads desc", signal })
        .then((albums) => archive.tracksFromAlbums(shuffleArray(albums), { perAlbum: 2, max: 10, signal })),
      [] as Track[],
    ),
  ]);
  const merged = dedupe(interleaveMany([js, yt, jam, au, ia]));
  return merged.length > 0 ? merged.slice(0, limit) : [];
}

/** Freshly added releases. */
export async function fetchFresh(opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 28, signal } = opts;
  const [au, jam, ia] = await Promise.all([
    settle(audius.fetchUnderground({ limit: 12, signal }), [] as Track[]),
    settle(jamendo.searchTracks("new", 10), [] as Track[]),
    settle(
      archive
        .searchAlbums({ collection: "netlabels", rows: 10, sort: "addeddate desc", signal })
        .then((albums) => archive.tracksFromAlbums(albums, { perAlbum: 2, max: 10, signal })),
      [] as Track[],
    ),
  ]);
  return dedupe(interleaveMany([au, jam, ia])).slice(0, limit);
}

/** A whole open collection (net labels, live concerts, 78rpm…). */
export async function fetchCollection(slug: string, opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 30, signal } = opts;
  const albums = await archive.searchAlbums({ collection: slug, rows: 26, sort: "downloads desc", signal });
  return dedupe(await archive.tracksFromAlbums(shuffleArray(albums), { perAlbum: 3, max: limit, signal }));
}

/** Genre feed — archive subject search merged with the open artist network. */
export async function fetchGenre(genre: string, opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 30, signal } = opts;
  const audiusGenre = AUDIUS_GENRE_MAP[genre.toLowerCase()] ?? genre;
  const [ia, au] = await Promise.all([
    settle(
      archive
        .searchAlbums({ genre, rows: 22, sort: "downloads desc", signal })
        .then((albums) => archive.tracksFromAlbums(shuffleArray(albums), { perAlbum: 2, max: limit, signal })),
      [] as Track[],
    ),
    settle(audius.fetchTracksByGenre(audiusGenre, { limit, signal }), [] as Track[]),
  ]);
  return dedupe(interleaveMany([au, ia])).slice(0, limit);
}

/** Full-text search across all active databases, including YouTube Music mirrors. */
export async function searchEverything(query: string, opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 60, signal } = opts;
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Search across multiple databases
  const [js, yt, jam, au, ia] = await Promise.all([
    settle(jiosaavn.searchTracks(trimmed, 35), [] as Track[]),
    settle(youtube.searchTracks(trimmed, 30), [] as Track[]),
    settle(jamendo.searchTracks(trimmed, 25), [] as Track[]),
    settle(audius.searchTracks(trimmed, { limit: 25, signal }), [] as Track[]),
    settle(archive.searchTracks(trimmed, { limit: 20, signal }), [] as Track[]),
  ]);

  const all = [...js, ...yt, ...au, ...jam, ...ia];
  
  return dedupe(all)
    .sort((a, b) => scoreTrack(trimmed, b) - scoreTrack(trimmed, a))
    .slice(0, limit);
}

export async function fetchSearchSuggestions(query: string, opts: CatalogQuery = {}): Promise<string[]> {
  const { limit = 8, signal } = opts;
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Get real suggestions from JioSaavn database (fast, actual song names)
  const [jsSugg, auSugg] = await Promise.all([
    settle(jiosaavn.fetchSuggestions(trimmed, limit), [] as string[]),
    settle(
      audius.searchTracks(trimmed, { limit: 4, signal }).then((tracks) =>
        tracks.map((t) => `${t.title} - ${t.artist}`)
      ),
      [] as string[],
    ),
  ]);

  return uniqueStrings([...jsSugg, ...auSugg]).slice(0, limit);
}

/** Map friendly archive genre words to the artist network's vocabulary. */
const AUDIUS_GENRE_MAP: Record<string, string> = {
  "hip hop": "Hip-Hop/Rap",
  "lo-fi": "Lo-Fi",
  lofi: "Lo-Fi",
  electronic: "Electronic",
  ambient: "Ambient",
  rock: "Rock",
  jazz: "Jazz",
  techno: "Techno",
  folk: "Folk",
  classical: "Classical",
  chiptune: "Electronic",
  blues: "Blues",
  punk: "Punk",
  reggae: "Reggae",
  soul: "R&B/Soul",
};

export const GENRE_CHIPS: { label: string; value: string }[] = [
  { label: "Electronic", value: "electronic" },
  { label: "Lo-Fi", value: "lo-fi" },
  { label: "Hip Hop", value: "hip hop" },
  { label: "Ambient", value: "ambient" },
  { label: "Rock", value: "rock" },
  { label: "Jazz", value: "jazz" },
  { label: "Techno", value: "techno" },
  { label: "Folk", value: "folk" },
  { label: "Classical", value: "classical" },
  { label: "Chiptune", value: "chiptune" },
  { label: "Blues", value: "blues" },
  { label: "Punk", value: "punk" },
  { label: "Reggae", value: "reggae" },
  { label: "Soul", value: "soul" },
];

export { ARCHIVE_COLLECTIONS } from "@/services/archive";
