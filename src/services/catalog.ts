/**
 * Unified catalogue — all sources combined.
 */
import * as archive from "@/services/archive";
import * as audius from "@/services/audius";
import * as jiosaavn from "@/services/jiosaavn";
import * as jamendo from "@/services/jamendo";
import * as youtube from "@/services/youtube";
import * as soundcloud from "@/services/soundcloud";
import { shuffleArray } from "@/utils/format";
import type { Track } from "@/types";

function normalizeText(v: string) {
  return v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = `${normalizeText(t.title)}|${normalizeText(t.artist)}`;
    if (seen.has(t.id) || seen.has(key)) return false;
    seen.add(t.id); seen.add(key);
    return true;
  });
}

function scoreTrack(q: string, t: Track): number {
  const nq = normalizeText(q);
  const title = normalizeText(t.title);
  let s = 0;
  if (title === nq) s += 200;
  if (title.startsWith(nq)) s += 100;
  if (title.includes(nq)) s += 50;
  if (t.source === "youtube") s += 60;
  if (t.source === "soundcloud") s += 40;
  if (t.source === "jiosaavn") s += 35;
  if (t.source === "audius") s += 15;
  if (t.playCount && t.playCount > 1_000_000) s += 10;
  return s;
}

const TIMEOUT = 5500;
function cap<T>(p: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([p.catch(() => fallback), new Promise<T>((r) => setTimeout(() => r(fallback), TIMEOUT))]);
}

export interface CatalogQuery { limit?: number; signal?: AbortSignal }

export async function fetchPopular(opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 40 } = opts;
  const [yt, js, sc, au] = await Promise.all([
    cap(youtube.searchTracks("popular music hits 2026", 15), []),
    cap(jiosaavn.fetchTrending(12), []),
    cap(soundcloud.searchTracks("trending popular", 10), []),
    cap(audius.fetchTrending({ limit: 8 }), []),
  ]);
  const merged = dedupe([...yt, ...js, ...sc, ...au]);
  return merged.slice(0, limit);
}

export async function fetchFresh(opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 24 } = opts;
  const [yt, sc, au] = await Promise.all([
    cap(youtube.searchTracks("new music 2026", 10), []),
    cap(soundcloud.searchTracks("new releases", 8), []),
    cap(audius.fetchUnderground({ limit: 8 }), []),
  ]);
  return dedupe([...yt, ...sc, ...au]).slice(0, limit);
}

export async function searchYTMusic(query: string, limit = 100): Promise<Track[]> {
  return cap(youtube.searchTracks(query, limit), []);
}

export async function searchOtherSources(query: string, limit = 60): Promise<Track[]> {
  const [sc, js, au, ja, ia] = await Promise.all([
    cap(soundcloud.searchTracks(query, 20), []),
    cap(jiosaavn.searchTracks(query, 25), []),
    cap(audius.searchTracks(query, { limit: 15 }), []),
    cap(jamendo.searchTracks(query, 12), []),
    cap(archive.searchTracks(query, { limit: 10 }), []),
  ]);
  return dedupe([...sc, ...js, ...au, ...ja, ...ia])
    .sort((a, b) => scoreTrack(query, b) - scoreTrack(query, a))
    .slice(0, limit);
}

export async function searchEverything(query: string, opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 80 } = opts;
  const [yt, others] = await Promise.all([
    searchYTMusic(query, 30),
    searchOtherSources(query, 50),
  ]);
  return dedupe([...yt, ...others])
    .sort((a, b) => scoreTrack(query, b) - scoreTrack(query, a))
    .slice(0, limit);
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  const [yt, js] = await Promise.all([
    cap(youtube.fetchSuggestions(query), [] as string[]),
    cap(jiosaavn.fetchSuggestions(query), [] as string[]),
  ]);
  return [...new Set([...yt, ...js])].slice(0, 10);
}

export async function fetchForYou(favorites: Track[]): Promise<Track[]> {
  if (favorites.length === 0) return [];
  const artists = [...new Set(favorites.slice(0, 5).map((f) => f.artist))];
  const pick = artists[Math.floor(Math.random() * artists.length)];
  return searchEverything(pick, { limit: 16 });
}

export async function fetchGenre(genre: string, opts: CatalogQuery = {}): Promise<Track[]> {
  return searchEverything(genre, { limit: opts.limit ?? 30 });
}

export async function fetchCollection(slug: string, opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 30, signal } = opts;
  const albums = await cap(archive.searchAlbums({ collection: slug, rows: 26, sort: "downloads desc", signal }), []);
  return cap(archive.tracksFromAlbums(shuffleArray(albums), { perAlbum: 3, max: limit, signal }), []);
}

export { ARCHIVE_COLLECTIONS } from "@/services/archive";

export const GENRE_CHIPS = [
  { label: "Pop", value: "pop hits" },
  { label: "Hip-Hop", value: "hip hop" },
  { label: "Bollywood", value: "bollywood" },
  { label: "Remix", value: "remix" },
  { label: "Slowed", value: "slowed reverb" },
  { label: "Lo-Fi", value: "lofi" },
  { label: "Electronic", value: "electronic" },
  { label: "Rock", value: "rock" },
  { label: "Jazz", value: "jazz" },
  { label: "K-Pop", value: "kpop" },
  { label: "Funk", value: "funk" },
  { label: "Classical", value: "classical" },
];
