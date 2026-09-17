/**
 * Unified open catalogue.
 * ----------------------------------------------------------------------------
 * AuraBeats never talks to a commercial/official music API, never uses an API
 * key and never plays 30-second previews. Every feed below resolves to
 * FULL-LENGTH audio from free, open, publicly mirrored archives:
 *
 *   • Internet Archive  — CC / public-domain music, direct MP3, multi-node
 *   • Audius            — open decentralised artist network, direct MP3
 *   • Radio Browser     — open live radio directory (Radio section only)
 *
 * Each helper races/merges the providers and degrades gracefully: if one
 * network is unreachable the feed still returns whatever the others produced,
 * so the UI is never empty and never breaks.
 */

import * as archive from "@/services/archive";
import * as audius from "@/services/audius";
import { shuffleArray } from "@/utils/format";
import type { Track } from "@/types";

function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const t of tracks) {
    const key = `${t.title.toLowerCase().trim()}|${t.artist.toLowerCase().trim()}`;
    if (seen.has(t.id) || seen.has(key)) continue;
    seen.add(t.id);
    seen.add(key);
    out.push(t);
  }
  return out;
}

/** Interleave two lists so results from both networks appear near the top. */
function interleave(a: Track[], b: Track[]): Track[] {
  const out: Track[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i]) out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
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

/** Most-downloaded full albums across the open archives, expanded to tracks. */
export async function fetchPopular(opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 34, signal } = opts;
  const [ia, au] = await Promise.all([
    settle(
      archive
        .searchAlbums({ collection: "netlabels", rows: 26, sort: "downloads desc", signal })
        .then((albums) => archive.tracksFromAlbums(shuffleArray(albums), { perAlbum: 2, max: limit, signal })),
      [] as Track[],
    ),
    settle(audius.fetchTrending({ limit, signal }), [] as Track[]),
  ]);
  const merged = dedupe(interleave(ia, au));
  return merged.length > 0 ? merged.slice(0, limit) : [];
}

/** Freshly added open releases. */
export async function fetchFresh(opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 28, signal } = opts;
  const [ia, au] = await Promise.all([
    settle(
      archive
        .searchAlbums({ collection: "netlabels", rows: 24, sort: "addeddate desc", signal })
        .then((albums) => archive.tracksFromAlbums(albums, { perAlbum: 2, max: limit, signal })),
      [] as Track[],
    ),
    settle(audius.fetchUnderground({ limit, signal }), [] as Track[]),
  ]);
  return dedupe(interleave(ia, au)).slice(0, limit);
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
  return dedupe(interleave(ia, au)).slice(0, limit);
}

/** Full-text search across both open networks. */
export async function searchEverything(query: string, opts: CatalogQuery = {}): Promise<Track[]> {
  const { limit = 40, signal } = opts;
  if (!query.trim()) return [];
  const [au, ia] = await Promise.all([
    settle(audius.searchTracks(query, { limit, signal }), [] as Track[]),
    settle(archive.searchTracks(query, { limit: Math.ceil(limit / 2), signal }), [] as Track[]),
  ]);
  return dedupe(interleave(au, ia)).slice(0, limit);
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
