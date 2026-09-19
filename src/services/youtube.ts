import type { Track } from "@/types";

const HOSTS = [
  "https://invidious.f5.si",
  "https://invidious.tiekoetter.com",
  "https://invidious.nerdvpn.de",
  "https://inv.nadeko.net",
];

let preferredIndex = Math.floor(Math.random() * HOSTS.length);

/** Healthy host order */
function getHosts() {
  return [...HOSTS.slice(preferredIndex), ...HOSTS.slice(0, preferredIndex)];
}

async function raceFetch<T>(path: string, params: Record<string, string>): Promise<{ data: T; host: string }> {
  const currentHosts = getHosts();
  const urlParams = new URLSearchParams(params).toString();
  const controllers = currentHosts.map(() => new AbortController());
  
  const promises = currentHosts.map(async (host, i) => {
    try {
      const res = await fetch(`${host}${path}?${urlParams}`, {
        signal: controllers[i].signal,
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Cancel others
      controllers.forEach((c, j) => { if (i !== j) c.abort(); });
      preferredIndex = i; // Updating for next run
      return { data, host };
    } catch (e) {
      throw e;
    }
  });

  // Racing manually to support older targets if needed, though vite handles it
  return new Promise((resolve, reject) => {
    let errors = 0;
    promises.forEach(p => {
      p.then(resolve).catch(() => {
        errors++;
        if (errors === promises.length) reject(new Error("All YouTube mirrors failed"));
      });
    });
  });
}

function normalize(v: any, host: string): Track {
  const videoId = v.videoId;
  return {
    id: `yt:${videoId}`,
    title: v.title,
    artist: v.author,
    artwork: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    artworkLarge: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration: v.lengthSeconds || 0,
    source: "youtube",
    // We use a local proxy through the invidious instance to play the audio
    streamUrl: `${host}/latest/videoplayback?id=${videoId}&itag=140&local=true`, 
    fallbackUrls: HOSTS.map(h => `${h}/latest/videoplayback?id=${videoId}&itag=140&local=true`),
    homepage: `https://www.youtube.com/watch?v=${videoId}`,
    isLive: false,
  };
}

export async function searchTracks(query: string, limit = 20): Promise<Track[]> {
  try {
    // We append "topic" or "official audio" to help filter for music only
    const musicQuery = `${query} official audio`;
    const { data, host } = await raceFetch<any[]>("/api/v1/search", {
      q: musicQuery,
      type: "video",
      sort: "relevance"
    });
    
    return (data || [])
      .filter(v => v.type === "video" && v.lengthSeconds < 600) // avoid long mixes/blogs
      .slice(0, limit)
      .map(v => normalize(v, host));
  } catch {
    return [];
  }
}
