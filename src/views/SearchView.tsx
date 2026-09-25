import { useEffect, useRef, useState } from "react";
import {
  Music2, Mic2, Search as SearchIcon, X, History,
  Flame, Headphones, SlidersHorizontal, Piano, Dumbbell, Clapperboard,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useDebouncedValue, useFeed } from "@/hooks/useFeed";
import { searchYTMusic, searchOtherSources, fetchSearchSuggestions } from "@/services/catalog";
import { TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Chip, SectionHeader, Spinner } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { storage } from "@/utils/storage";
import { usePlayer } from "@/hooks/usePlayer";
import type { Track } from "@/types";

const RECENT_KEY = "searchRecent";

const DISCOVER = [
  { label: "Trending Now", icon: Flame, query: "trending hits 2026", gradient: "from-orange-500/80 to-red-600/80" },
  { label: "Lofi Chill", icon: Headphones, query: "lofi chill beats", gradient: "from-indigo-500/80 to-violet-700/80" },
  { label: "Deep House", icon: SlidersHorizontal, query: "deep house music", gradient: "from-cyan-500/80 to-blue-700/80" },
  { label: "Piano Solo", icon: Piano, query: "piano solo instrumental", gradient: "from-slate-400/70 to-zinc-700/80" },
  { label: "Workout Mix", icon: Dumbbell, query: "workout motivation", gradient: "from-green-500/80 to-emerald-700/80" },
  { label: "Bollywood", icon: Clapperboard, query: "bollywood hits", gradient: "from-pink-500/80 to-rose-700/80" },
  { label: "Hip-Hop", icon: Mic2, query: "hip hop rap", gradient: "from-yellow-500/80 to-amber-700/80" },
  { label: "Classical", icon: Music2, query: "classical orchestra", gradient: "from-purple-500/80 to-fuchsia-700/80" },
  { label: "K-Pop", icon: Flame, query: "kpop hits 2026", gradient: "from-rose-400/80 to-pink-700/80" },
  { label: "Remix", icon: SlidersHorizontal, query: "remix 2026", gradient: "from-blue-400/80 to-indigo-700/80" },
  { label: "Slowed + Reverb", icon: Headphones, query: "slowed reverb songs", gradient: "from-teal-500/80 to-cyan-800/80" },
  { label: "Funk", icon: Music2, query: "funk music", gradient: "from-lime-500/80 to-green-800/80" },
];

export function SearchView() {
  const [query, setQuery] = useState("");
  const { settings } = usePlayer();
  const [view, setView] = useState<"ytmusic" | "sources">(
    () => (settings.rememberSearchTab ? storage.get("lastSearchTab", "ytmusic") : "ytmusic") as "ytmusic" | "sources"
  );
  const [recent, setRecent] = useState<string[]>(() => storage.get<string[]>(RECENT_KEY, []));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestRef = useRef<HTMLDivElement | null>(null);

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 300);
  const suggestDebounced = useDebouncedValue(trimmed, 180);
  const enabled = debounced.length > 0;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setVisibleCount(20); }, [debounced]);

  useEffect(() => {
    if (suggestDebounced.length < 2) { setSuggestions([]); return; }
    let alive = true;
    fetchSearchSuggestions(suggestDebounced)
      .then((r) => { if (alive) setSuggestions(r); })
      .catch(() => {});
    return () => { alive = false; };
  }, [suggestDebounced]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!suggestRef.current?.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const ytFeed = useFeed<Track[]>(
    `search:yt:${debounced}`,
    () => searchYTMusic(debounced, 100),
    { enabled: enabled && view === "ytmusic", ttl: 10 * 60 * 1000 },
  );

  const otherFeed = useFeed<Track[]>(
    `search:other:${debounced}`,
    () => searchOtherSources(debounced, 80),
    { enabled: enabled && view === "sources", ttl: 10 * 60 * 1000 },
  );

  const activeFeed = view === "ytmusic" ? ytFeed : otherFeed;
  const allTracks = activeFeed.data ?? [];
  const displayed = allTracks.slice(0, visibleCount);

  const remember = (v: string) => {
    const next = [v.trim(), ...recent].filter((s, i, a) => s && a.indexOf(s) === i).slice(0, 10);
    setRecent(next);
    storage.set(RECENT_KEY, next);
  };

  const pick = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    remember(s);
  };

  useEffect(() => {
    if (!activeFeed.data) return;
    const el = document.getElementById("ab-scroll");
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setVisibleCount((c) => Math.min(c + 20, activeFeed.data!.length));
      }
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [activeFeed.data]);

  return (
    <div className="space-y-6 pb-4">
      <section className="space-y-4">
        {/* Search bar */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 sm:-mx-8 sm:px-8">
          <div className="relative mx-auto max-w-2xl" ref={suggestRef}>
            <div className="blur-panel glass-inset flex items-center gap-2 rounded-full p-1 pl-4 focus-within:ring-2 focus-within:ring-accent/50">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => { if (trimmed.length > 2) remember(trimmed); }}
                onKeyDown={(e) => { if (e.key === "Escape") { setShowSuggestions(false); inputRef.current?.blur(); } }}
                placeholder="Search songs, artists, lyrics..."
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] font-semibold text-ink outline-none placeholder:text-ink3"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="mr-1 rounded-full p-2 text-ink3 hover:text-ink">
                  <X className="h-5 w-5" />
                </button>
              )}
              {enabled && activeFeed.loading && <Spinner className="mx-2 h-4 w-4" />}
            </div>

            {showSuggestions && suggestions.length > 0 && trimmed.length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl blur-panel shadow-2xl animate-fade-in">
                {suggestions.map((s) => (
                  <button key={s} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink2 transition hover:bg-ink/[0.07] hover:text-ink">
                    <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink3" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 pt-1">
          {([
            { key: "ytmusic" as const, label: "YT Music", icon: Music2 },
            { key: "sources" as const, label: "Other Sources", icon: Mic2 },
          ]).map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => {
              setView(key);
              if (settings.rememberSearchTab) storage.set("lastSearchTab", key);
            }}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95",
                view === key
                  ? "bg-accent text-white shadow-[0_8px_24px_-14px_var(--c-accent)]"
                  : "border border-white/10 bg-white/[0.03] text-ink3 hover:text-ink",
              )}>
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>
      </section>

      {/* Empty state */}
      {!enabled && (
        <div className="space-y-8 animate-fade-in pt-2">
          {recent.length > 0 && (
            <section>
              <SectionHeader title="Recent searches" icon={<History className="h-5 w-5 text-accent" />} />
              <div className="flex flex-wrap gap-2">
                {recent.map((item) => <Chip key={item} onClick={() => setQuery(item)}>{item}</Chip>)}
              </div>
            </section>
          )}
          <section>
            <SectionHeader title="Browse" />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
              {DISCOVER.map(({ label, icon: Icon, query: q, gradient }) => (
                <button key={label} onClick={() => setQuery(q)}
                  className={cn("group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br h-20 sm:h-24 text-left shadow-lg transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.97]", gradient)}>
                  <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10 rounded-xl" />
                  <div className="relative z-10 flex h-full flex-col justify-end gap-1.5 p-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 ring-1 ring-white/25">
                      <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
                    </span>
                    <span className="text-xs font-bold tracking-tight text-white drop-shadow">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Results */}
      {enabled && (
        <section className="space-y-4 animate-fade-in">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">
              {view === "ytmusic" ? "YouTube Music" : "Other Sources"}
            </h2>
            {allTracks.length > 0 && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-ink3">
                {allTracks.length} found
              </span>
            )}
          </div>

          {activeFeed.error && !activeFeed.data ? (
            <ErrorState message={activeFeed.error} onRetry={activeFeed.refresh} />
          ) : activeFeed.loading && !activeFeed.data ? (
            <TrackRowSkeleton rows={8} />
          ) : allTracks.length === 0 ? (
            <EmptyState title={`No results for "${debounced}"`} hint="Try another keyword or switch tabs." />
          ) : (
            <div className="blur-panel glass-inset overflow-hidden rounded-2xl p-1.5 sm:p-2">
              {displayed.map((track, i) => (
                <TrackRow key={track.id} track={track} context={allTracks} index={i} />
              ))}
              {activeFeed.loading && <div className="flex justify-center p-6"><Spinner /></div>}
              {!activeFeed.loading && allTracks.length > 0 && visibleCount >= allTracks.length && (
                <p className="py-4 text-center text-xs text-ink3">
                  {allTracks.length} tracks loaded
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
