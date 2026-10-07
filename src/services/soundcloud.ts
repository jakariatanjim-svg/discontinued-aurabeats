/**
 * SoundCloud via public-facing widget API.
 * No private client_id needed — uses the resolve endpoint.
 */
import type { Track } from "@/types";

const SC_SEARCH = "https://api-v2.soundcloud.com/search/tracks";

// These client IDs are embedded in SoundCloud's JS bundles. They rotate but
// the fallback chain makes at least one work at any given time.
const CLIENT_IDS = [
  "iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX",
  "a3e059563d7fd3372b49b37f00a00bcf",
  "2t9loNQH90kzJcsFCODdigxfp325aq4z",
  "eK5Gg2OQNF7xFV8aBdTtjqpGMF6JMhh",
];

const CORS = [
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function fetchViaProxy<T>(url: string): Promise<T> {
  for (const proxy of CORS) {
    try {
      const res = await fetch(proxy(url), {
        headers: { Accept: "application/json" },
      });
      if (res.ok) return res.json() as Promise<T>;
    } catch { /* next proxy */ }
  }
  throw new Error("All proxies failed");
}

interface SCTrack {
  id: number;
  title: string;
  user: { username: string };
  artwork_url: string | null;
  duration: number;
  permalink_url: string;
  playback_count: number;
  media?: { transcodings?: { url: string; format: { protocol: string } }[] };
  stream_url?: string;
}

function toTrack(t: SCTrack): Track {
  const art = t.artwork_url?.replace("-large", "-t500x500") || "";
  return {
    id: `sc:${t.id}`,
    title: t.title,
    artist: t.user?.username || "SoundCloud",
    artwork: art,
    artworkLarge: art,
    duration: Math.floor(t.duration / 1000),
    source: "soundcloud",
    streamUrl: `sc-resolve:${t.id}`,
    fallbackUrls: [],
    homepage: t.permalink_url,
    isLive: false,
    playCount: t.playback_count,
  };
}

export async function searchTracks(query: string, limit = 15): Promise<Track[]> {
  for (const cid of CLIENT_IDS) {
    try {
      const url = `${SC_SEARCH}?q=${encodeURIComponent(query)}&limit=${limit}&client_id=${cid}`;
      const data = await fetchViaProxy<{ collection: SCTrack[] }>(url);
      const tracks = (data.collection ?? []).map(toTrack);
      if (tracks.length > 0) return tracks;
    } catch { /* try next client_id */ }
  }
  return [];
}

export async function resolveStreamUrls(scId: string): Promise<{ urls: string[] }> {
  for (const cid of CLIENT_IDS) {
    try {
      const url = `https://api-v2.soundcloud.com/tracks/${scId}?client_id=${cid}`;
      const data = await fetchViaProxy<SCTrack>(url);
      const transcodings = data.media?.transcodings ?? [];
      const progressive = transcodings.find((t) => t.format?.protocol === "progressive") ?? transcodings[0];
      if (!progressive) continue;

      const streamData = await fetchViaProxy<{ url: string }>(`${progressive.url}?client_id=${cid}`);
      if (streamData.url) return { urls: [streamData.url] };
    } catch { /* next cid */ }
  }
  throw new Error("SoundCloud stream resolve failed");
}
