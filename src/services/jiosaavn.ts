import type { Track } from "@/types";

const HOSTS = [
  "https://saavn.sumit.co",
  "https://jiosaavn-api-liart-three.vercel.app",
  "https://jiosaavn-api-sumit.vercel.app",
];

const REQUEST_TIMEOUT = 6000;

async function raceFetch<T>(path: string): Promise<T> {
  const controllers = HOSTS.map(() => new AbortController());
  const promises = HOSTS.map(async (host, i) => {
    const url = `${host}${path}`;
    const res = await fetch(url, {
      signal: controllers[i].signal,
      headers: { "Accept": "application/json" }
    });
    if (!res.ok) throw new Error(`Failed ${host}`);
    const data = await res.json();
    // Cancel others if we win
    controllers.forEach((c, j) => { if (i !== j) c.abort(); });
    return data;
  });

  // Custom race to avoid ES2021 dependency — plus a hard timeout so a hung
  // mirror never freezes the whole feed.
  return new Promise((resolve, reject) => {
    let rejected = 0;
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      controllers.forEach((c) => c.abort());
      reject(new Error("All mirrors timed out"));
    }, REQUEST_TIMEOUT);
    promises.forEach((p) => {
      p.then((v) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(v);
      }).catch(() => {
        rejected++;
        if (rejected === promises.length && !done) {
          done = true;
          clearTimeout(timer);
          reject(new Error("All mirrors failed"));
        }
      });
    });
  });
}

function normalize(raw: any): Track {
  const id = raw.id;
  // Pick best quality artwork
  const art = raw.image?.[2]?.url || raw.image?.[1]?.url || raw.image?.[0]?.url || "";
  // Pick best quality download/stream
  const stream = raw.downloadUrl?.[4]?.url || raw.downloadUrl?.[3]?.url || raw.downloadUrl?.[2]?.url || "";
  
  return {
    id: `js:${id}`,
    title: raw.name?.replace(/&quot;/g, '"')?.replace(/&amp;/g, "&") || "Untitled",
    artist: raw.artists?.primary?.[0]?.name || "JioSaavn Artist",
    artwork: art,
    artworkLarge: art,
    duration: parseInt(raw.duration) || 0,
    source: "jiosaavn",
    streamUrl: stream,
    fallbackUrls: raw.downloadUrl?.map((d: any) => d.url).reverse() || [],
    homepage: raw.url,
    album: raw.album?.name,
    releaseDate: raw.releaseDate,
    isLive: false,
  };
}

export async function searchTracks(query: string, limit = 12): Promise<Track[]> {
  try {
    const json = await raceFetch<any>(`/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    const results = json.data?.results || [];
    return results.map(normalize);
  } catch {
    return [];
  }
}

export async function fetchTrending(limit = 10): Promise<Track[]> {
  try {
    const json = await raceFetch<any>(`/api/search/songs?query=latest&limit=${limit}`);
    const results = json.data?.results || [];
    return results.map(normalize);
  } catch {
    return [];
  }
}

export async function fetchSuggestions(query: string, limit = 8): Promise<string[]> {
  try {
    const json = await raceFetch<any>(`/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`);
    const results = json.data?.results || [];
    const names: string[] = results.map((r: any) => {
      const title = r.name?.replace(/&quot;/g, '"')?.replace(/&amp;/g, "&") || "";
      const artist = r.artists?.primary?.[0]?.name || "";
      return artist ? `${title} - ${artist}` : title;
    }).filter(Boolean);
    return names.slice(0, limit);
  } catch {
    return [];
  }
}
