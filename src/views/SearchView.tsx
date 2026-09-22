import { useEffect, useRef, useState } from "react";
import { Mic2, Music2, Search as SearchIcon, Sparkles, X, History, ChevronLeft } from "lucide-react";
import { cn } from "@/utils/cn";
import { useDebouncedValue, useFeed } from "@/hooks/useFeed";
import { fetchArtistTracks, searchArtists } from "@/services/audius";
import { searchEverything } from "@/services/catalog";
import { TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Artwork, Chip, SectionHeader, Spinner } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { formatCount } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { storage } from "@/utils/storage";
import type { Artist, Track } from "@/types";

const RECENT_KEY = "searchRecent";
const DISCOVER = [
  "Trending Now",
  "Lofi Chill",
  "Deep House",
  "Piano Solo",
  "Workout Mix",
  "Bollywood Hits",
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
  const [view, setView] = useState<"all" | "tracks" | "artists">("all");
  const [artist, setArtist] = useState<Artist | null>(null);
  const [recent, setRecent] = useState<string[]>(() => storage.get<string[]>(RECENT_KEY, []));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { playAll } = usePlayer();

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 300); // Optimized for real-time feel
  const enabled = debounced.length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setArtist(null);
  }, [debounced]);

  // Infinite-style rendering state logic
  const [visibleCount, setVisibleCount] = useState(20);
  useEffect(() => {
    setVisibleCount(20); // Reset count when search changes
  }, [debounced]);

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
  const displayedTracks = allTracks.slice(0, view === "all" ? 12 : visibleCount);
  const visibleArtists = (artists.data ?? []).slice(0, view === "artists" ? 24 : 6);

  const rememberSearch = (value: string) => {
    const next = uniqueStrings([value.trim(), ...recent]).slice(0, 10);
    setRecent(next);
    storage.set(RECENT_KEY, next);
  };

  // Scroll handler for infinite scroll feel
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
    <div className="space-y-6 pb-4">
      <section className="space-y-4">
        {/* Sticky Search Input like Spotify */}
        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 sm:-mx-8 sm:px-8 bg-[var(--c-base)]/80 backdrop-blur-xl border-b border-white/5">
          <div className="relative max-w-4xl mx-auto">
            <div className="blur-panel glass-inset flex items-center gap-2 rounded-full p-1 pl-4 transition-all duration-300 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)] focus-within:ring-2 focus-within:ring-accent/50 focus-within:shadow-[0_12px_40px_-10px_var(--c-accent)]">
              <SearchIcon className="h-5 w-5 shrink-0 text-ink3 group-focus-within:text-accent" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => {
                  if (trimmed.length > 2) rememberSearch(trimmed);
                }}
                placeholder="What do you want to listen to?"
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] font-semibold text-ink outline-none placeholder:text-ink3 placeholder:font-medium"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="focus-ring mr-1 rounded-full p-2 text-ink3 hover:bg-ink/10 hover:text-ink transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              {enabled && (tracks.loading || artists.loading) && <Spinner className="mx-2 h-4 w-4" />}
            </div>
          </div>
        </div>

        {/* View Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {(
            [
              { key: "all", label: "All", icon: Sparkles },
              { key: "tracks", label: "Tracks", icon: Music2 },
              { key: "artists", label: "Artists", icon: Mic2 },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={cn(
                "focus-ring glass-inset inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 active:scale-95",
                view === key
                  ? "bg-accent text-white shadow-[0_8px_24px_-14px_var(--c-accent)] border-none"
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {DISCOVER.map((item) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className="group relative aspect-square overflow-hidden rounded-[24px] bg-gradient-to-br from-accent/20 to-accent2/20 p-4 text-left shadow-lg transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_15px_30px_-10px_var(--c-accent)]"
                >
                  <span className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <span className="relative text-lg font-black tracking-tight text-white drop-shadow-md">
                    {item}
                  </span>
                  <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-accent/40 blur-2xl group-hover:bg-accent/60 transition-colors" />
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
              <p className="truncate text-3xl font-black tracking-tight text-ink drop-shadow-sm">{artist.name}</p>
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
          {(view === "all" || view === "tracks") && (
            <section className="space-y-4 animate-fade-in">
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-black tracking-tight text-ink">Songs</h2>
                {view === "tracks" && allTracks.length > 0 && (
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
                <div className="blur-panel glass-inset overflow-hidden p-2 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)] rounded-[1.5rem]">
                  {displayedTracks.map((track, index) => (
                    <TrackRow key={track.id} track={track} context={allTracks} index={index} />
                  ))}
                  
                  {view === "tracks" && tracks.loading && (
                    <div className="flex justify-center p-6">
                      <Spinner />
                    </div>
                  )}
                  
                  {view === "all" && allTracks.length > 12 && (
                    <button 
                      onClick={() => setView("tracks")}
                      className="w-full p-4 text-sm font-bold text-ink hover:bg-white/5 transition-colors text-center"
                    >
                      See all songs
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {(view === "all" || view === "artists") && (
            <section className="space-y-4 animate-fade-in">
              <h2 className="text-2xl font-black tracking-tight text-ink">Artists</h2>
              
              {artists.error && !artists.data ? (
                <ErrorState message={artists.error} onRetry={artists.refresh} />
              ) : artists.loading && !artists.data ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: view === "artists" ? 12 : 6 }).map((_, index) => (
                    <div key={index} className="blur-panel p-4 rounded-[1.5rem]">
                      <div className="skeleton mx-auto mb-3 aspect-square w-3/4 rounded-full" />
                      <div className="skeleton mx-auto h-3 w-1/2 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : visibleArtists.length === 0 ? (
                view === "artists" ? (
                  <EmptyState title={`No artists found for "${debounced}"`} hint="Try another name or switch to All for song matches." />
                ) : null
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {visibleArtists.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setArtist(item)}
                      className="blur-panel glass-inset group flex flex-col items-center justify-center p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_var(--c-accent)] rounded-[1.5rem]"
                    >
                      <div className="mx-auto mb-4 w-4/5 overflow-hidden rounded-full shadow-2xl transition-transform duration-500 group-hover:scale-105 ring-2 ring-white/5 group-hover:ring-accent/50">
                        <Artwork src={item.avatar || undefined} alt={item.name} className="aspect-square w-full" rounded="rounded-full" />
                      </div>
                      <p className="w-full truncate text-[14px] font-black text-ink">{item.name}</p>
                      <p className="mt-1 w-full truncate text-[11px] font-medium text-ink3 opacity-70">Artist</p>
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
