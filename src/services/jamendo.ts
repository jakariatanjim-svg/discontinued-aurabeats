import type { Track } from "@/types";

const CLIENT_ID = "56d30c95";
const BASE = "https://api.jamendo.com/v3.0";

async function fetchJamendo(path: string): Promise<any> {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}client_id=${CLIENT_ID}&format=json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error("Jamendo failed");
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function normalize(raw: any): Track {
  return {
    id: `jam:${raw.id}`,
    title: raw.name,
    artist: raw.artist_name,
    artwork: raw.image || raw.album_image,
    artworkLarge: raw.image?.replace("1.200.jpg", "1.600.jpg") || raw.album_image,
    duration: raw.duration,
    source: "jamendo",
    streamUrl: raw.audio,
    fallbackUrls: [raw.audiodownload],
    homepage: raw.shareurl,
    album: raw.album_name,
    releaseDate: raw.releasedate,
    isLive: false,
    tags: raw.musicinfo?.tags?.genres || [],
  };
}

export async function searchTracks(query: string, limit = 12): Promise<Track[]> {
  try {
    const json = await fetchJamendo(`/tracks/?search=${encodeURIComponent(query)}&limit=${limit}&include=musicinfo`);
    return (json.results || []).map(normalize);
  } catch {
    return [];
  }
}

export async function fetchPopular(limit = 10): Promise<Track[]> {
  try {
    const json = await fetchJamendo(`/tracks/?order=popularity_month&limit=${limit}&include=musicinfo`);
    return (json.results || []).map(normalize);
  } catch {
    return [];
  }
}
