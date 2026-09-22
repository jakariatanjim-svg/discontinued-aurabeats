/**
 * YouTube Music Engine — Piped Instance Pool
 * ---------------------------------------------------------------------------
 * Replaced Invidious with Piped API for better reliability and faster streaming.
 * Features:
 *  - Parallel racing across multiple Piped instances
 *  - Music-only filtering
 *  - Real-time audio stream resolution
 */

import type { Track } from "@/types";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://api-piped.mha.fi",
  "https://pipedapi.us.to",
  "https://piped-api.garudalinux.org",
  "https://pipedapi.roke.host"
];

let preferredIndex = Math.floor(Math.random() * PIPED_INSTANCES.length);

async function racePiped<T>(path: string, params: Record<string, string>): Promise<{ data: T; host: string }> {
  const urlParams = new URLSearchParams(params).toString();
  const instances = [...PIPED_INSTANCES.slice(preferredIndex), ...PIPED_INSTANCES.slice(0, preferredIndex)];
  const controllers = instances.map(() => new AbortController());

  const promises = instances.map(async (host, i) => {
    try {
      const res = await fetch(`${host}${path}?${urlParams}`, {
        signal: controllers[i].signal,
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      controllers.forEach((c, j) => { if (i !== j) c.abort(); });
      preferredIndex = (preferredIndex + i) % PIPED_INSTANCES.length;
      return { data, host };
    } catch {
      throw new Error("Instance failed");
    }
  });

  return new Promise((resolve, reject) => {
    let errors = 0;
    let done = false;
    // Hard timeout — hung Piped mirrors must never freeze the feed.
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      controllers.forEach((c) => c.abort());
      reject(new Error("All Piped mirrors timed out"));
    }, 6000);
    promises.forEach(p => {
      p.then((v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      }).catch(() => {
        errors++;
        if (errors === promises.length && !done) {
          done = true;
          clearTimeout(timer);
          reject(new Error("All Piped mirrors failed"));
        }
      });
    });
  });
}

/** Resolves playable stream URLs from a video ID at play-time */
export async function resolveStreamUrls(videoId: string): Promise<{ urls: string[], bitrate?: number, codec?: string }> {
  const instances = [...PIPED_INSTANCES.slice(preferredIndex), ...PIPED_INSTANCES.slice(0, preferredIndex)];
  
  for (const host of instances) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(`${host}/streams/${videoId}`, { signal: ctrl.signal });
      if (!res.ok) continue;
      const data = await res.json();
      
      // Get highest quality audio stream
      const audio = (data.audioStreams || [])
        .filter((s: any) => s.mimeType?.includes("audio"))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

      if (audio.length > 0) {
        return {
          urls: audio.map((s: any) => s.url),
          bitrate: Math.round((audio[0].bitrate || 0) / 1024),
          codec: audio[0].format || "MP3"
        };
      }
    } catch { continue; }
    finally { clearTimeout(timer); }
  }
  throw new Error("Could not resolve Piped stream");
}

function normalize(v: any): Track {
  const id = v.url.split("v=")[1] || v.url.split("/").pop();
  return {
    id: `yt:${id}`,
    title: v.title,
    artist: v.uploaderName,
    artwork: v.thumbnail,
    artworkLarge: v.thumbnail,
    duration: v.duration || 0,
    source: "youtube",
    streamUrl: `yt-resolve:${id}`,
    fallbackUrls: [`yt-resolve:${id}`],
    homepage: `https://www.youtube.com/watch?v=${id}`,
    isLive: false,
  };
}

export async function searchTracks(query: string, limit = 50): Promise<Track[]> {
  try {
    const { data } = await racePiped<any>("/search", {
      q: query,
      filter: "music_songs"
    });
    
    return (data.items || [])
      .slice(0, limit)
      .map((v: any) => normalize(v));
  } catch {
    return [];
  }
}
