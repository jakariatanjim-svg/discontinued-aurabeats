import type { Track } from "@/types";

const HOSTS = [
  "https://saavn.sumit.co",
  "https://jiosaavn-api-liart-three.vercel.app",
  "https://jiosaavn-api-sumit.vercel.app",
];

async function raceFetch<T>(path: string): Promise<T> {
  const controllers = HOSTS.map(() => new AbortController());
  const timer = setTimeout(() => controllers.forEach((c) => c.abort()), 7000);

  return new Promise((resolve, reject) => {
    let done = false;
    let failed = 0;

    HOSTS.forEach((host, i) => {
      fetch(`${host}${path}`, {
        signal: controllers[i].signal,
        headers: { Accept: "application/json" },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`${res.status}`);
          const data = await res.json();
          if (done) return;
          done = true;
          clearTimeout(timer);
          controllers.forEach((c, j) => { if (j !== i) c.abort(); });
          resolve(data as T);
        })
        .catch(() => {
          failed++;
          if (failed >= HOSTS.length && !done) {
            done = true;
            clearTimeout(timer);
            reject(new Error("All JioSaavn mirrors failed"));
          }
        });
    });
  });
}

function normalize(raw: Record<string, unknown>): Track | null {
  const id = raw.id as string;
  if (!id) return null;
  const images = (raw.image as { url: string }[] | undefined) ?? [];
  const art = images[2]?.url || images[1]?.url || images[0]?.url || "";
  const downloads = (raw.downloadUrl as { url: string }[] | undefined) ?? [];
  const stream = downloads[4]?.url || downloads[3]?.url || downloads[2]?.url || downloads[0]?.url || "";
  if (!stream) return null;

  const artistsObj = raw.artists as { primary?: { name: string }[] } | undefined;
  const artist = artistsObj?.primary?.[0]?.name || (raw.subtitle as string) || "Unknown";

  return {
    id: `js:${id}`,
    title: ((raw.name || raw.title) as string)?.replace(/&quot;/g, '"').replace(/&amp;/g, "&") || "Unknown",
    artist,
    artwork: art,
    artworkLarge: art.replace("150x150", "500x500"),
    duration: parseInt(raw.duration as string) || 0,
    source: "jiosaavn",
    streamUrl: stream,
    fallbackUrls: downloads.map((d) => d.url).reverse(),
    homepage: raw.url as string || "",
    album: (raw.album as { name?: string } | undefined)?.name,
    isLive: false,
  };
}

export async function searchTracks(query: string, limit = 20): Promise<Track[]> {
  try {
    const json = await raceFetch<Record<string, unknown>>(
      `/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    const results = (json.data as { results?: Record<string, unknown>[] } | undefined)?.results ?? [];
    return results.map(normalize).filter((t): t is Track => t !== null);
  } catch {
    return [];
  }
}

export async function fetchTrending(limit = 12): Promise<Track[]> {
  return searchTracks("top hindi songs 2026", limit);
}

export async function fetchSuggestions(query: string, limit = 8): Promise<string[]> {
  try {
    const json = await raceFetch<Record<string, unknown>>(
      `/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`
    );
    const results = (json.data as { results?: Record<string, unknown>[] } | undefined)?.results ?? [];
    return results
      .map((r) => {
        const title = ((r.name || r.title) as string)?.replace(/&quot;/g, '"') || "";
        const artist = (r.artists as { primary?: { name: string }[] } | undefined)?.primary?.[0]?.name || "";
        return artist ? `${title} - ${artist}` : title;
      })
      .filter(Boolean)
      .slice(0, limit);
  } catch {
    return [];
  }
}
