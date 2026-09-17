/**
 * Internet Archive — open, free, full-length music.
 * ----------------------------------------------------------------------------
 * The Archive hosts millions of Creative-Commons / public-domain audio items
 * (net-labels, Free Music Archive mirrors, live concert recordings, community
 * uploads). Everything here is:
 *   • completely free, no API key, no account, no quota
 *   • FULL-LENGTH tracks — never 30 second previews
 *   • served with `Access-Control-Allow-Origin: *` and byte-range support
 *
 * Two endpoints are used, both key-less:
 *   1. /advancedsearch.php  -> find audio items that actually contain MP3s
 *   2. /metadata/{id}       -> the item's real file list + its storage nodes
 *
 * Every track is returned with several equivalent stream URLs (the canonical
 * /download redirect plus each physical storage node), which feeds the
 * player's automatic fail-over engine.
 */

import type { Track } from "@/types";

const SEARCH = "https://archive.org/advancedsearch.php";
const METADATA = "https://archive.org/metadata";

/** Audio formats a browser can decode natively, best first. */
const PLAYABLE = [
  { re: /^VBR MP3$/i, rank: 0 },
  { re: /^(128|192|256|320)Kbps MP3$/i, rank: 1 },
  { re: /^MP3$/i, rank: 2 },
  { re: /^64Kbps MP3$/i, rank: 3 },
  { re: /^Ogg Vorbis$/i, rank: 4 },
];

function formatRank(format: string): number {
  for (const f of PLAYABLE) if (f.re.test(format)) return f.rank;
  return -1;
}

async function getJson<T>(url: string, signal?: AbortSignal, timeout = 14000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const relay = () => ctrl.abort();
  signal?.addEventListener("abort", relay);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Archive responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", relay);
  }
}

interface SearchDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  year?: string | number;
  downloads?: number;
  subject?: string | string[];
  date?: string;
}

interface MetaFile {
  name: string;
  format?: string;
  length?: string;
  title?: string;
  track?: string;
  artist?: string;
  album?: string;
  size?: string;
}

interface MetaResponse {
  server?: string;
  d1?: string;
  d2?: string;
  dir?: string;
  files?: MetaFile[];
  metadata?: {
    identifier?: string;
    title?: string;
    creator?: string | string[];
    date?: string;
    subject?: string | string[];
    licenseurl?: string;
  };
}

function firstString(v?: string | string[]): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseLength(len?: string): number {
  if (!len) return 0;
  if (/^\d+(\.\d+)?$/.test(len)) return Math.round(parseFloat(len));
  const parts = len.split(":").map((p) => parseFloat(p) || 0);
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  return 0;
}

/** Turn a raw archive filename into something presentable. */
function prettyName(file: MetaFile): string {
  if (file.title && file.title.trim()) return file.title.trim();
  const cleaned = file.name
    .replace(/\.[a-z0-9]+$/i, "") // extension
    .replace(/^\d{1,3}\s*[-._)\]]\s*/, "") // leading track number
    .replace(/^[a-z]{2,}\d{2,}[\s._-]+/i, "") // catalogue code prefix (e.g. hiliv003_)
    .replace(/[_]+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!cleaned) return file.name;
  // title-case words that are entirely lowercase
  return cleaned
    .split(" ")
    .map((w) => (/^[a-z][a-z0-9']*$/.test(w) ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Reject non-song artefacts: multi-hour shows, jingles and silence. */
function isSongLength(seconds: number): boolean {
  if (seconds === 0) return true; // unknown length — let the player decide
  return seconds >= 25 && seconds <= 45 * 60;
}

/**
 * Build the mirror chain for one file.
 * The canonical /download URL comes first (the Archive load-balancer picks a
 * healthy node), followed by every physical storage node reported in the
 * item's metadata. Individual nodes do occasionally go offline, so handing the
 * player 3-4 equivalent endpoints makes playback effectively bullet-proof.
 */
function streamUrls(id: string, file: string, meta: MetaResponse): string[] {
  const encFile = encodeURIComponent(file);
  const urls = [`https://archive.org/download/${encodeURIComponent(id)}/${encFile}`];
  const dirPath = meta.dir ? `${meta.dir}/${encFile}` : "";
  // d1/d2 are the replica nodes; `server` is the primary and is retried last.
  for (const node of [meta.d1, meta.d2, meta.server]) {
    if (node && dirPath) urls.push(`https://${node}${dirPath}`);
  }
  return [...new Set(urls)];
}

/**
 * Item artwork.
 * `/services/img/` is the "official" thumbnail route but it is rate-limited and
 * frequently answers 504, so we use the item's own `__ia_thumb.jpg`, which is
 * generated for every item and served straight from storage.
 */
export function coverUrl(identifier: string): string {
  return `https://archive.org/download/${encodeURIComponent(identifier)}/__ia_thumb.jpg`;
}

/** Prefer a real cover image from the item's file list when one exists. */
function bestCover(identifier: string, files: MetaFile[]): string {
  const images = files.filter((f) => /\.(jpe?g|png)$/i.test(f.name) && !/__ia_thumb/i.test(f.name));
  const scored = images
    .map((f) => {
      const n = f.name.toLowerCase();
      let score = 0;
      if (/cover|front|folder|album|artwork/.test(n)) score += 10;
      if (/thumb|small|back|disc|inlay/.test(n)) score -= 6;
      if (/\.(jpe?g)$/i.test(n)) score += 1;
      return { f, score };
    })
    .sort((a, b) => b.score - a.score);
  const pick = scored[0];
  if (pick && pick.score > 0) {
    return `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(pick.f.name)}`;
  }
  return coverUrl(identifier);
}

/** Turn one Archive item into playable Track objects. */
export async function itemTracks(
  identifier: string,
  opts: { limit?: number; signal?: AbortSignal; fallbackTitle?: string; fallbackArtist?: string } = {},
): Promise<Track[]> {
  const { limit = 40, signal, fallbackTitle, fallbackArtist } = opts;
  const meta = await getJson<MetaResponse>(`${METADATA}/${encodeURIComponent(identifier)}`, signal);
  const files = meta.files ?? [];
  if (files.length === 0) return [];

  const art = bestCover(identifier, files);
  const albumTitle = meta.metadata?.title ?? fallbackTitle ?? identifier;
  const albumArtist = firstString(meta.metadata?.creator) ?? fallbackArtist ?? "Open archive artist";
  const tags = (Array.isArray(meta.metadata?.subject)
    ? meta.metadata?.subject
    : (meta.metadata?.subject ?? "").split(/[,;]/)
  )
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 5);

  /** group by base name so we keep only the best format of each song */
  const best = new Map<string, { file: MetaFile; rank: number }>();
  for (const f of files) {
    const rank = formatRank(f.format ?? "");
    if (rank < 0) continue;
    if (!/\.(mp3|ogg)$/i.test(f.name)) continue;
    const base = f.name.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
    const existing = best.get(base);
    if (!existing || rank < existing.rank) best.set(base, { file: f, rank });
  }

  const ordered = [...best.values()]
    .map((e) => e.file)
    .filter((f) => isSongLength(parseLength(f.length)))
    .sort((a, b) => {
      const ta = parseInt(a.track ?? "0", 10) || 0;
      const tb = parseInt(b.track ?? "0", 10) || 0;
      if (ta !== tb) return ta - tb;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return ordered.map((f) => {
    const urls = streamUrls(identifier, f.name, meta);
    return {
      id: `ia:${identifier}:${f.name}`,
      title: prettyName(f),
      artist: (f.artist && f.artist.trim()) || albumArtist,
      artwork: art,
      artworkLarge: art,
      artworkFallback: coverUrl(identifier),
      duration: parseLength(f.length),
      genre: tags[0],
      tags,
      source: "archive",
      streamUrl: urls[0],
      fallbackUrls: urls,
      homepage: `https://archive.org/details/${encodeURIComponent(identifier)}`,
      album: f.album || albumTitle,
      releaseDate: meta.metadata?.date,
      codec: /ogg/i.test(f.format ?? "") ? "OGG" : "MP3",
      isLive: false,
    } satisfies Track;
  });
}

export interface ArchiveAlbum {
  identifier: string;
  title: string;
  artist: string;
  artwork: string;
  downloads: number;
  year?: string;
  tags: string[];
}

function buildQuery(parts: string[]): string {
  return parts.filter(Boolean).join(" AND ");
}

export interface AlbumQuery {
  /** free-text search */
  query?: string;
  /** archive collection slug, e.g. netlabels */
  collection?: string;
  /** subject/genre keyword */
  genre?: string;
  rows?: number;
  page?: number;
  sort?: "downloads desc" | "addeddate desc" | "week desc" | "reviewdate desc";
  signal?: AbortSignal;
}

/** Search the Archive for audio items that really contain playable MP3s. */
export async function searchAlbums(opts: AlbumQuery = {}): Promise<ArchiveAlbum[]> {
  const { query, collection, genre, rows = 30, page = 1, sort = "downloads desc", signal } = opts;
  const clauses = [
    "mediatype:(audio)",
    'format:("VBR MP3")',
    // keep the feeds musical — drop spoken word / talk archives
    "-collection:(oldtimeradio)",
    "-collection:(audio_bookspoetry)",
    "-collection:(radioprograms)",
    "-collection:(audio_news)",
    "-collection:(podcasts)",
    collection ? `collection:(${collection})` : "",
    genre ? `subject:(${JSON.stringify(genre)})` : "",
    query ? `(title:(${JSON.stringify(query)}) OR creator:(${JSON.stringify(query)}) OR subject:(${JSON.stringify(query)}))` : "",
  ];
  const url = new URL(SEARCH);
  url.searchParams.set("q", buildQuery(clauses));
  ["identifier", "title", "creator", "year", "downloads", "subject", "date"].forEach((f) =>
    url.searchParams.append("fl[]", f),
  );
  url.searchParams.append("sort[]", sort);
  url.searchParams.set("rows", String(rows));
  url.searchParams.set("page", String(page));
  url.searchParams.set("output", "json");

  const json = await getJson<{ response?: { docs?: SearchDoc[] } }>(url.toString(), signal);
  const docs = json.response?.docs ?? [];
  return docs
    .filter((d) => d.identifier)
    .map((d) => ({
      identifier: d.identifier,
      title: (d.title || d.identifier).toString().trim(),
      artist: firstString(d.creator)?.trim() || "Open archive artist",
      artwork: coverUrl(d.identifier),
      downloads: Number(d.downloads) || 0,
      year: d.year ? String(d.year) : undefined,
      tags: (Array.isArray(d.subject) ? d.subject : (d.subject ?? "").split(/[,;]/))
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 4),
    }));
}

/**
 * Build a ready-to-play track list by expanding several albums in parallel.
 * Used for the home feeds so the user always lands on real, playable songs.
 */
export async function tracksFromAlbums(
  albums: ArchiveAlbum[],
  opts: { perAlbum?: number; max?: number; signal?: AbortSignal } = {},
): Promise<Track[]> {
  const { perAlbum = 3, max = 40, signal } = opts;
  // cap concurrency — each album costs one metadata round-trip
  const picked = albums.slice(0, Math.min(12, Math.ceil(max / perAlbum) + 3));
  const settled = await Promise.allSettled(
    picked.map((a) =>
      itemTracks(a.identifier, {
        limit: perAlbum,
        signal,
        fallbackTitle: a.title,
        fallbackArtist: a.artist,
      }),
    ),
  );
  // round-robin across albums so one huge item can't dominate the feed
  const buckets = settled.map((r) => (r.status === "fulfilled" ? r.value : []));
  const out: Track[] = [];
  for (let slot = 0; slot < perAlbum && out.length < max; slot += 1) {
    for (const bucket of buckets) {
      if (bucket[slot]) out.push(bucket[slot]);
      if (out.length >= max) break;
    }
  }
  return out.slice(0, max);
}

export async function searchTracks(query: string, opts: { limit?: number; signal?: AbortSignal } = {}): Promise<Track[]> {
  const { limit = 30, signal } = opts;
  const albums = await searchAlbums({ query, rows: 22, signal });
  return tracksFromAlbums(albums, { perAlbum: 3, max: limit, signal });
}

/** Curated open collections — each is a live Archive query, nothing hardcoded. */
export const ARCHIVE_COLLECTIONS: { label: string; slug: string; blurb: string }[] = [
  { label: "Net Labels", slug: "netlabels", blurb: "Free-to-share label releases" },
  { label: "Free Music Archive", slug: "freemusicarchive", blurb: "Curated CC catalogue" },
  { label: "Community Audio", slug: "opensource_audio", blurb: "Independent uploads" },
  { label: "Live Concerts", slug: "etree", blurb: "Artist-approved recordings" },
  { label: "78 RPM & Cylinders", slug: "78rpm", blurb: "Public-domain classics" },
  { label: "Classical", slug: "audio_music", blurb: "Open music library" },
];

export const ARCHIVE_GENRES: string[] = [
  "electronic",
  "ambient",
  "hip hop",
  "rock",
  "jazz",
  "lo-fi",
  "techno",
  "folk",
  "classical",
  "chiptune",
  "blues",
  "punk",
  "reggae",
  "soul",
];
