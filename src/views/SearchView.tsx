import { useEffect, useRef, useState } from "react";
import {
  Mic2, Music2, Search as SearchIcon, X, History, ChevronLeft,
  Flame, Headphones, SlidersHorizontal, Piano, Dumbbell, Clapperboard,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useDebouncedValue, useFeed } from "@/hooks/useFeed";
import { fetchArtistTracks, searchArtists } from "@/services/audius";
import { searchEverything, fetchSearchSuggestions } from "@/services/catalog";
import { TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Artwork, Chip, SectionHeader, Spinner } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { formatCount } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { storage } from "@/utils/storage";
import type { Artist, Track } from "@/types";

const RECENT_KEY = "searchRecent";
const DISCOVER: { label: string; icon: typeof Flame; query: string; gradient: string }[] = [
  { label: "Trending Now", icon: Flame,             query: "trending hits 2025",     gradient: "from-orange-500/70 to-red-600/70" },
  { label: "Lofi Chill",   icon: Headphones,        query: "lofi chill beats",       gradient: "from-indigo-500/70 to-violet-700/70" },
  { label: "Deep House",   icon: SlidersHorizontal, query: "deep house music",       gradient: "from-cyan-500/70 to-blue-700/70" },
  { label: "Piano Solo",   icon: Piano,             query: "piano solo instrumental", gradient: "from-slate-500/70 to-zinc-700/70" },
  { label: "Workout Mix",  icon: Dumbbell,          query: "workout motivation mix",  gradient: "from-green-500/70 to-emerald-700/70" },
  { label: "Bollywood",    icon: Clapperboard,      query: "bollywood hits",          gradient: "from-pink-500/70 to-rose-700/70" },
];

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"tracks" | "artists">("tracks");
  const [artist, setArtist] = useState<Artist | null>(null);
  const [recent, setRecent] = useState<string[]>(() => storage.get<string[]>(RECENT_KEY, []));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestRef = useRef<HTMLDivElement | null>(null);
  const { playAll } = usePlayer();

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 300);
  const suggestDebounced = useDebouncedValue(trimmed, 180);
  const enabled = debounced.length > 0;

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setArtist(null); }, [debounced]);

  // --- Autocomplete suggestions ---
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    if (suggestDebounced.length < 2) { setSuggestions([]); return; }
    let alive = true;
    fetchSearchSuggestions(suggestDebounced, { limit: 6 })
      .then((r) => { if (alive) setSuggestions(r); })
      .catch(() => {});
    return () => { alive = false; };
  }, [suggestDebounced]);

  // close suggestions on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!suggestRef.current?.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // --- Infinite scroll ---
  const [visibleCount, setVisibleCount] = useState(20);
  useEffect(() => { setVisibleCount(20); }, [debounced]);

  const tracks = useFeed<Track[]>(
    `search:tracks:${debounced}`,
    (signal) => searchEverything(debounced, { limit: 120, signal }),
    { enabled: enabled && view !== "artists", ttl: 10 * 60 * 1000 },
  );

  const artists = useFeed<Artist[]>(
    `search:artists:${debounced}`,
    (signal) => searchArtists(debounced, { limit: 24, signal }),
    { enabled: enabled && view !== "tracks", ttl: 5 * 60 * 1000 },
  );

  const artistTracks = useFeed<Track[]>(
    `search:artist-tracks:${artist?.handle ?? ""}`,
    (signal) => fetchArtistTracks(artist?.handle ?? "", { limit: 50, signal }),
    { enabled: Boolean(artist), ttl: 5 * 60 * 1000 },
  );

  const allTracks = tracks.data ?? [];
  const displayedTracks = allTracks.slice(0, visibleCount);
  const hasMore = visibleCount < allTracks.length;
  const visibleArtists = (artists.data ?? []).slice(0, 24);

  const rememberSearch = (value: string) => {
    const next = uniqueStrings([value.trim(), ...recent]).slice(0, 10);
    setRecent(next);
    storage.set(RECENT_KEY, next);
  };

  const pickSuggestion = (s: string) => {
    setQuery(s);
    setShowSuggestions(false);
    rememberSearch(s);
  };

  // scroll-based infinite load
  useEffect(() => {
    if (view !== "tracks" || !tracks.data) return;
    const onScroll = () => {
      const scrollEl = document.getElementById("ab-scroll");
      if (!scrollEl) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setVisibleCount((c) => Math.min(c + 20, tracks.data!.length));
      }
    };
    const scrollEl = document.getElementById("ab-scroll");
    scrollEl?.addEventListener("scroll", onScroll);
    return () => scrollEl?.removeEventListener("scroll", onScroll);
  }, [view, tracks.data]);

  return (
    <div className="space-y-6 pb-4" id="home-search">
      <section className="space-y-4">
        {/* Sticky Search Input */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 sm:-mx-8 sm:px-8 bg-[var(--c-base)]/60 backdrop-blur-3xl border-b border-white/5">
          <div className="relative max-w-2xl mx-auto" ref={suggestRef}>
            <div className="blur-panel glass-inset flex items-center gap-2 rounded-full bg-white/[0.02] p-1 pl-4 transition-colors duration-150 focus-within:bg-white/[0.05] focus-within:ring-2 focus-within:ring-accent/50">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => { if (trimmed.length > 2) rememberSearch(trimmed); }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setShowSuggestions(false); inputRef.current?.blur(); }
                }}
                placeholder="Search songs, artists, albums..."
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] font-semibold text-ink outline-none placeholder:text-ink3 placeholder:font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  className="focus-ring mr-1 rounded-full p-2 text-ink3 hover:bg-ink/10 hover:text-ink transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {enabled && (tracks.loading || artists.loading) && <Spinner className="mx-2 h-4 w-4" />}
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && trimmed.length >= 2 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl blur-panel glass-inset shadow-2xl border border-white/10 animate-fade-in">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink2 transition-colors hover:bg-ink/[0.07] hover:text-ink"
                  >
                    <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink3" />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {([
            { key: "tracks", label: "Tracks", icon: Music2 },
            { key: "artists", label: "Artists", icon: Mic2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors duration-150 active:scale-95",
                view === key
                  ? "bg-accent text-white shadow-[0_8px_24px_-14px_var(--c-accent)]"
                  : "bg-white/[0.03] text-ink3 hover:bg-white/[0.08] hover:text-ink border border-white/10",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Empty State / Browse */}
      {!enabled && (
        <div className="space-y-8 animate-fade-in pt-4">
          {recent.length > 0 && (
            <section>
              <SectionHeader title="Recent searches" icon={<History className="h-5 w-5 text-accent" />} />
              <div className="flex flex-wrap gap-2">
                {recent.slice(0, 10).map((item) => (
                  <Chip key={item} onClick={() => setQuery(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
            </section>
          )}
          <section>
            <SectionHeader title="Browse all" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {DISCOVER.map(({ label, icon: Icon, query: q, gradient }) => (
                <button
                  key={label}
                  onClick={() => setQuery(q)}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl p-4 text-left shadow-lg",
                    "bg-gradient-to-br", gradient,
                    "border border-white/10",
                    "transition-colors duration-150 hover:brightness-110 active:scale-[0.97]",
                    "aspect-[2.5/1] sm:aspect-[2/1]",
                  )}
                >
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors rounded-2xl" />
                  <div className="relative z-10 flex h-full items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 shrink-0">
                      <Icon className="h-4 w-4 text-white" strokeWidth={2.25} />
                    </span>
                    <span className="text-sm font-bold tracking-tight text-white leading-tight">
                      {label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Artist Profile View */}
      {enabled && artist && (
        <div className="space-y-4 animate-fade-in">
          <button
            type="button"
            onClick={() => setArtist(null)}
            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back to search
          </button>
          <div className="blur-panel glass-inset flex flex-col gap-5 p-6 sm:flex-row sm:items-center rounded-[2rem]">
            <Artwork src={artist.avatar || undefined} alt={artist.name} className="h-20 w-20 sm:h-28 sm:w-28 shadow-2xl ring-4 ring-white/10" rounded="rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-3xl font-black tracking-tight text-ink">{artist.name}</p>
              <p className="mt-1 truncate text-sm font-medium text-ink3">
                {formatCount(artist.followers)} followers · {artist.trackCount} tracks
              </p>
            </div>
            {artistTracks.data && artistTracks.data.length > 0 && (
              <button
                type="button"
                onClick={() => playAll(artistTracks.data ?? [], 0)}
                className="shrink-0 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white shadow-[0_10px_30px_-10px_var(--c-accent)] transition hover:brightness-110 active:scale-95"
              >
                Play all
              </button>
            )}
          </div>
          <div className="blur-panel glass-inset overflow-hidden p-2 shadow-2xl rounded-[1.5rem]">
            {artistTracks.loading && !artistTracks.data ? (
              <TrackRowSkeleton rows={5} />
            ) : (
              (artistTracks.data ?? []).map((track, index) => (
                <TrackRow key={track.id} track={track} context={artistTracks.data ?? undefined} index={index} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Real-time Results View */}
      {enabled && !artist && (
        <div className="space-y-8">
          {view === "tracks" && (
            <section className="space-y-4 animate-fade-in">
              <div className="flex items-end justify-between">
                <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Songs</h2>
                {allTracks.length > 0 && (
                  <span className="text-xs font-bold text-ink3 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {allTracks.length} found
                  </span>
                )}
              </div>
              
              {tracks.error && !tracks.data ? (
                <ErrorState message={tracks.error} onRetry={tracks.refresh} />
              ) : tracks.loading && !tracks.data ? (
                <TrackRowSkeleton rows={8} />
              ) : allTracks.length === 0 ? (
                <EmptyState title={`No songs found for "${debounced}"`} hint="Try spelling it differently or use fewer keywords." />
              ) : (
                <div className="blur-panel glass-inset overflow-hidden p-1.5 sm:p-2 rounded-2xl">
                  {displayedTracks.map((track, index) => (
                    <TrackRow key={track.id} track={track} context={allTracks} index={index} />
                  ))}
                  
                  {/* Infinite scroll indicator */}
                  {tracks.loading && (
                    <div className="flex justify-center p-6">
                      <Spinner />
                    </div>
                  )}

                  {/* End of results */}
                  {!hasMore && allTracks.length > 0 && !tracks.loading && (
                    <p className="py-4 text-center text-xs text-ink3">
                      End of results · {allTracks.length} tracks loaded
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          {view === "artists" && (
            <section className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-black tracking-tight text-ink sm:text-2xl">Artists</h2>
              
              {artists.error && !artists.data ? (
                <ErrorState message={artists.error} onRetry={artists.refresh} />
              ) : artists.loading && !artists.data ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="blur-panel p-4 rounded-2xl">
                      <div className="skeleton mx-auto mb-3 aspect-square w-3/4 rounded-full" />
                      <div className="skeleton mx-auto h-3 w-1/2 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : visibleArtists.length === 0 ? (
                <EmptyState title={`No artists found for "${debounced}"`} hint="Try another name or switch to Tracks." />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleArtists.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setArtist(item)}
                      className="blur-panel glass-inset group flex flex-col items-center justify-center p-4 sm:p-5 text-center transition-colors duration-150 hover:bg-ink/[0.05] rounded-2xl"
                    >
                      <div className="mx-auto mb-3 w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-full shadow-xl ring-2 ring-white/5 group-hover:ring-accent/40 transition-colors duration-150">
                        <Artwork src={item.avatar || undefined} alt={item.name} className="h-full w-full" rounded="rounded-full" />
                      </div>
                      <p className="w-full truncate text-sm font-bold text-ink">{item.name}</p>
                      <p className="mt-0.5 text-[11px] text-ink3">{formatCount(item.followers)} followers</p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
