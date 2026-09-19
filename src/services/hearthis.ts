import type { Track } from "@/types";

const BASE = "https://api-v2.hearthis.at";

async function fetchHearThis(path: string): Promise<any> {
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("HearThis failed");
  return res.json();
}

function normalize(raw: any): Track {
  return {
    id: `ht:${raw.id}`,
    title: raw.title,
    artist: raw.user?.username || "Independent Artist",
    artwork: raw.thumb,
    artworkLarge: raw.artwork_url,
    duration: parseInt(raw.duration) || 0,
    source: "hearthis",
    streamUrl: raw.stream_url,
    fallbackUrls: [raw.download_url],
    homepage: raw.permalink_url,
    genre: raw.genre,
    isLive: false,
  };
}

export async function searchTracks(query: string, limit = 12): Promise<Track[]> {
  try {
    const json = await fetchHearThis(`/search?t=${encodeURIComponent(query)}&count=${limit}`);
    if (!Array.isArray(json)) return [];
    return json.map(normalize);
  } catch {
    return [];
  }
}

export async function fetchTrending(limit = 10): Promise<Track[]> {
  try {
    const json = await fetchHearThis(`/feed/?type=trending&count=${limit}`);
    if (!Array.isArray(json)) return [];
    return json.map(normalize);
  } catch {
    return [];
  }
}
