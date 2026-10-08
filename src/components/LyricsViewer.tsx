import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface LyricsData {
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

export function LyricsViewer({ trackName, artistName }: { trackName: string; artistName: string }) {
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    setLyrics(null);

    // Clean up title for better matching (remove text in brackets, etc.)
    const cleanTitle = trackName.replace(/\[.*?\]|\(.*?\)/g, "").trim();
    
    fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle + ' ' + artistName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        if (data && data.length > 0) {
          // Just take the first result's plain lyrics for now as a safe fallback
          setLyrics({
            syncedLyrics: data[0].syncedLyrics,
            plainLyrics: data[0].plainLyrics
          });
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, [trackName, artistName]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>;
  }

  if (error || !lyrics || (!lyrics.plainLyrics && !lyrics.syncedLyrics)) {
    return <div className="flex h-full items-center justify-center text-sm text-white/40">No lyrics found for this track.</div>;
  }

  // Displaying plain lyrics for safety and stability
  const lines = (lyrics.syncedLyrics || lyrics.plainLyrics || "").split('\n');

  return (
    <div className="h-full w-full overflow-y-auto scroll-area px-4 pb-12 pt-4 mask-edges">
      <div className="flex flex-col gap-4 text-center">
        {lines.map((line, i) => {
          // Clean up lrc timestamps if any like [00:12.34]
          const text = line.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim();
          if (!text) return null;
          return (
            <p key={i} className="text-lg font-bold text-white/90 drop-shadow-md sm:text-xl">
              {text}
            </p>
          );
        })}
      </div>
      <style>{`
        .mask-edges {
          mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
}
