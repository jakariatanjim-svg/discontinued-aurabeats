import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import anyAscii from "any-ascii";
import { usePlaybackClock } from "@/hooks/usePlayer";

function cleanTitle(raw: string): string {
  return raw
    .replace(/\[.*?\]|\(.*?\)/g, "")
    .replace(/\|.*/g, "")
    .replace(/[-–—].*(video|song|audio|lyric|hd|4k|8k|official|full|new|feat|ft)/gi, "")
    .replace(/(official|video|audio|lyric|lyrics|hd|4k|8k|full|new|song)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

interface SyncLine { time: number; text: string }

function parseLRC(raw: string): SyncLine[] {
  const out: SyncLine[] = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (m) {
      const t = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3].padEnd(3, "0")) / 1000;
      const text = m[4].trim();
      if (text) out.push({ time: t, text });
    }
  }
  return out;
}

export function LyricsViewer({ trackName, artistName, currentTime: _currentTime }: { trackName: string; artistName: string; currentTime?: number }) {
  const [plainLines, setPlainLines] = useState<string[]>([]);
  const [syncLines, setSyncLines] = useState<SyncLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [romanized, setRomanized] = useState(false);
  const [hasNonLatin, setHasNonLatin] = useState(false);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const { currentTime } = usePlaybackClock();

  // ALL hooks ABOVE any conditional returns

  // Reset on track change
  useEffect(() => { setRomanized(false); }, [trackName]);

  // Fetch lyrics
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setPlainLines([]);
    setSyncLines([]);
    setHasNonLatin(false);

    const clean = cleanTitle(trackName);
    const artist = artistName.replace(/ - Topic$/i, "").replace(/ VEVO$/i, "").trim();
    const queries = [`${clean} ${artist}`, clean, trackName.split("|")[0].trim()];

    const tryQ = async (i: number) => {
      if (!alive || i >= queries.length) {
        if (alive) { setNotFound(true); setLoading(false); }
        return;
      }
      try {
        const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(queries[i])}`);
        const data = await res.json();
        if (!alive) return;
        const hit = Array.isArray(data) ? data.find((d: any) => d.plainLyrics || d.syncedLyrics) : null;
        if (hit) {
          const raw = hit.plainLyrics || hit.syncedLyrics || "";
          setHasNonLatin(/[^\x00-\x7F]/.test(raw));
          if (hit.syncedLyrics) setSyncLines(parseLRC(hit.syncedLyrics));
          setPlainLines(raw.split("\n").map((l: string) => l.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim()).filter(Boolean));
          setLoading(false);
        } else {
          tryQ(i + 1);
        }
      } catch { if (alive) tryQ(i + 1); }
    };
    tryQ(0);
    return () => { alive = false; };
  }, [trackName, artistName]);

  // Auto-scroll synced lyrics
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Compute active line (no hook, just derived)
  const isSynced = syncLines.length > 0;
  const activeIdx = isSynced
    ? syncLines.reduce((best, line, i) => (line.time <= currentTime ? i : best), 0)
    : -1;

  const transform = (t: string) => romanized ? anyAscii(t) : t;

  // === RENDER ===

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-white/50" />
        <p className="text-xs text-white/40">Searching lyrics...</p>
      </div>
    );
  }

  if (notFound || (plainLines.length === 0 && syncLines.length === 0)) {
    return <div className="flex h-full items-center justify-center text-sm text-white/40">No lyrics found.</div>;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden relative">
      {hasNonLatin && (
        <div className="flex justify-center px-4 pt-1 pb-2 z-20">
          <button
            onClick={() => setRomanized((v) => !v)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition shadow-lg",
              romanized
                ? "bg-accent text-white"
                : "border border-white/20 bg-black/50 text-white/70 backdrop-blur-md hover:text-white hover:bg-black/60"
            )}
          >
            {romanized ? "Original" : "Romanized"}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 pt-4 mask-edges">
        <div className="flex flex-col gap-5 text-center min-h-[40vh]">
          {isSynced
            ? syncLines.map((line, i) => {
                const active = i === activeIdx;
                const past = i < activeIdx;
                return (
                  <p
                    key={i}
                    ref={active ? activeRef : undefined}
                    className={cn(
                      "text-xl sm:text-2xl font-black leading-snug transition-all duration-300",
                      active && "text-white scale-[1.04] drop-shadow-[0_0_14px_rgba(255,255,255,0.5)]",
                      past && "text-white/35",
                      !active && !past && "text-white/20 blur-[0.5px]",
                    )}
                  >
                    {transform(line.text)}
                  </p>
                );
              })
            : plainLines.map((text, i) => (
                <p key={i} className="text-xl font-bold text-white/80 leading-relaxed sm:text-2xl">
                  {transform(text)}
                </p>
              ))}
        </div>
      </div>

      <style>{`.mask-edges{mask-image:linear-gradient(to bottom,transparent,#000 20%,#000 80%,transparent);-webkit-mask-image:linear-gradient(to bottom,transparent,#000 20%,#000 80%,transparent)}`}</style>
    </div>
  );
}
