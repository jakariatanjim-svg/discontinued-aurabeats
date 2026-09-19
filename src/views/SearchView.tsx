import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Mic2, Music2, Search as SearchIcon, Sparkles, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useDebouncedValue, useFeed } from "@/hooks/useFeed";
import { fetchArtistTracks, searchArtists } from "@/services/audius";
import { fetchSearchSuggestions, searchEverything } from "@/services/catalog";
import { TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Artwork, Chip, SectionHeader, Spinner } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { formatCount } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { storage } from "@/utils/storage";
import type { Artist, Track } from "@/types";

const RECENT_KEY = "searchRecent";
const DISCOVER = [
  "blinding lights",
  "shape of you",
  "sunflower post malone",
  "perfect ed sheeran",
  "believer imagine dragons",
  "heat waves",
  "lovely billie eilish",
  "jazz cafe",
  "deep house mix",
  "lofi chill beats",
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeText(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "tracks" | "artists">("all");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [recent, setRecent] = useState<string[]>(() => storage.get<string[]>(RECENT_KEY, []));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { playAll } = usePlayer();

  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 180);
  const enabled = debounced.length >= 2;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setArtist(null);
  }, [debounced]);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const tracks = useFeed<Track[]>(
    `search:tracks:${debounced}`,
    (signal) => searchEverything(debounced, { limit: 28, signal }),
    { enabled: enabled && view !== "artists", ttl: 5 * 60 * 1000 },
  );

  const artists = useFeed<Artist[]>(
    `search:artists:${debounced}`,
    (signal) => searchArtists(debounced, { limit: 18, signal }),
    { enabled: enabled && view !== "tracks", ttl: 5 * 60 * 1000 },
  );

  const artistTracks = useFeed<Track[]>(
    `search:artist-tracks:${artist?.handle ?? ""}`,
    (signal) => fetchArtistTracks(artist?.handle ?? "", { limit: 50, signal }),
    { enabled: Boolean(artist), ttl: 5 * 60 * 1000 },
  );

  const liveSuggestions = useFeed<string[]>(
    `search:suggestions:${trimmed.toLowerCase()}`,
    (signal) => fetchSearchSuggestions(trimmed, { limit: 8, signal }),
    { enabled: focused && trimmed.length >= 1, ttl: 24 * 60 * 60 * 1000 }, // Suggestions are stable
  );

  const suggestionItems = useMemo(() => {
    if (!focused) return [] as string[];

    const needle = normalizeText(trimmed);
    const recentMatches = recent.filter((item) => normalizeText(item).includes(needle));
    
    if (!trimmed) {
      return uniqueStrings([...recentMatches, ...DISCOVER]).slice(0, 8);
    }

    const discoverMatches = DISCOVER.filter((item) => normalizeText(item).includes(needle));
    return uniqueStrings([trimmed, ...recentMatches, ...(liveSuggestions.data || []), ...discoverMatches]).slice(0, 8);
  }, [focused, trimmed, recent, liveSuggestions.data]);

  const visibleTracks = (tracks.data ?? []).slice(0, view === "tracks" ? 28 : 12);
  const visibleArtists = (artists.data ?? []).slice(0, view === "artists" ? 18 : 6);
  const showSuggestions = focused && suggestionItems.length > 0;

  const rememberSearch = (value: string) => {
    const next = uniqueStrings([value.trim(), ...recent]).slice(0, 10);
    setRecent(next);
    storage.set(RECENT_KEY, next);
  };

  const runSearch = (value: string, blur = true) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    setQuery(cleaned);
    setArtist(null);
    rememberSearch(cleaned);
    setActiveIndex(-1);
    if (blur) {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <section className="space-y-4">
        <SectionHeader
          title="Search anything"
          subtitle="Real-time results from JioSaavn, Jamendo, Audius, HearThis & Archive"
          icon={<SearchIcon className="h-4 w-4 text-accent" />}
        />

        <div ref={wrapRef} className="relative max-w-4xl">
          <div
            className={cn(
              "blur-panel flex items-center gap-2 rounded-[1.4rem] p-2 pl-4 transition-all duration-200",
              focused && "ring-1 ring-accent/45 shadow-[0_10px_30px_-18px_var(--c-accent)]",
            )}
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-accent" />
            <input
              ref={inputRef}
              value={query}
              onFocus={() => setFocused(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && suggestionItems.length > 0) {
                  e.preventDefault();
                  setActiveIndex((index) => (index + 1) % suggestionItems.length);
                } else if (e.key === "ArrowUp" && suggestionItems.length > 0) {
                  e.preventDefault();
                  setActiveIndex((index) => (index <= 0 ? suggestionItems.length - 1 : index - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (activeIndex >= 0 && suggestionItems[activeIndex]) {
                    runSearch(suggestionItems[activeIndex]);
                  } else {
                    runSearch(query);
                  }
                } else if (e.key === "Escape") {
                  setFocused(false);
                  setActiveIndex(-1);
                  inputRef.current?.blur();
                }
              }}
              placeholder="Search like YouTube: song title, artist, lyrics, remix…"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink3"
              aria-label="Search songs, artists and music mirrors"
            />
            {trimmed && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  setFocused(true);
                  inputRef.current?.focus();
                }}
                className="focus-ring rounded-full p-1.5 text-ink3 hover:bg-ink/10 hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {(liveSuggestions.loading || (enabled && (tracks.loading || artists.loading))) && <Spinner className="mx-1 h-4 w-4" />}
          </div>

          {showSuggestions && (
            <div className="blur-panel absolute inset-x-0 top-[calc(100%+0.7rem)] z-[80] max-h-[24rem] overflow-y-auto p-2 shadow-2xl">
              <div className="mb-1 flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-[0.16em] text-ink3 uppercase">
                <span>{trimmed ? "Suggestions" : "Recent & discover"}</span>
                {trimmed && liveSuggestions.loading && <span className="text-accent">fetching…</span>}
              </div>

              {suggestionItems.map((item, index) => {
                const active = index === activeIndex;
                const recentHit = recent.some((entry) => normalizeText(entry) === normalizeText(item));
                return (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runSearch(item);
                    }}
                    className={cn(
                      "focus-ring flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                      active ? "bg-accent/12 text-accent" : "text-ink2 hover:bg-ink/[0.06] hover:text-ink",
                    )}
                  >
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", active ? "bg-accent/16" : "bg-ink/[0.06]")}>
                      {recentHit ? <Clock3 className="h-3.5 w-3.5" /> : <SearchIcon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{item}</span>
                    {index === 0 && trimmed && <span className="text-[10px] font-bold tracking-wide text-ink3 uppercase">Top</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
                "focus-ring inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition",
                view === key
                  ? "border-accent bg-accent text-white shadow-[0_8px_24px_-14px_var(--c-accent)]"
                  : "border-line text-ink3 hover:border-accent/50 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {!enabled && (
        <div className="space-y-6">
          <section>
            <SectionHeader title="Start with something easy" subtitle="Tap a recent search or a popular idea" />
            <div className="flex flex-wrap gap-2">
              {uniqueStrings([...recent, ...DISCOVER]).slice(0, 14).map((item) => (
                <Chip key={item} onClick={() => runSearch(item)}>
                  {item}
                </Chip>
              ))}
            </div>
          </section>
          <EmptyState
            title="Find songs faster"
            hint="Suggestions now appear only while the search box is active, with recent searches, live hinting and stronger song matching across every source."
          />
        </div>
      )}

      {enabled && artist && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setArtist(null)}
            className="text-xs font-bold text-accent hover:underline"
          >
            ← Back to results
          </button>
          <div className="blur-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <Artwork src={artist.avatar || undefined} alt={artist.name} className="h-16 w-16 sm:h-20 sm:w-20" rounded="rounded-full" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black text-ink">{artist.name}</p>
              <p className="truncate text-xs text-ink3">
                {formatCount(artist.followers)} followers · {artist.trackCount} tracks
                {artist.verified ? " · verified" : ""}
              </p>
            </div>
            {artistTracks.data && artistTracks.data.length > 0 && (
              <button
                type="button"
                onClick={() => playAll(artistTracks.data ?? [], 0)}
                className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-white transition hover:brightness-110"
              >
                Play all
              </button>
            )}
          </div>
          <div className="blur-panel overflow-hidden p-2">
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

      {enabled && !artist && (
        <div className="space-y-6">
          {(view === "all" || view === "tracks") && (
            <section className="space-y-3">
              <SectionHeader
                title={view === "tracks" ? `Tracks for “${debounced}”` : "Top song matches"}
                subtitle="Multi-source ranked results from JioSaavn, Jamendo, Audius & more"
                icon={<Music2 className="h-4 w-4 text-accent" />}
              />
              {tracks.error && !tracks.data ? (
                <ErrorState message={tracks.error} onRetry={tracks.refresh} />
              ) : tracks.loading && !tracks.data ? (
                <TrackRowSkeleton rows={8} />
              ) : visibleTracks.length === 0 ? (
                <EmptyState title={`No tracks found for “${debounced}”`} hint="Try another spelling, artist name or add a word like lyrics, live or remix." />
              ) : (
                <div className="blur-panel overflow-hidden p-2">
                  {visibleTracks.map((track, index) => (
                    <TrackRow key={track.id} track={track} context={tracks.data ?? undefined} index={index} />
                  ))}
                </div>
              )}
            </section>
          )}

          {(view === "all" || view === "artists") && (
            <section className="space-y-3">
              <SectionHeader
                title={view === "artists" ? `Artists for “${debounced}”` : "Artist matches"}
                subtitle="Jump into an artist profile and play their available catalogue"
                icon={<Mic2 className="h-4 w-4 text-accent2" />}
              />
              {artists.error && !artists.data ? (
                <ErrorState message={artists.error} onRetry={artists.refresh} />
              ) : artists.loading && !artists.data ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {Array.from({ length: view === "artists" ? 12 : 6 }).map((_, index) => (
                    <div key={index} className="blur-panel p-4">
                      <div className="skeleton mx-auto mb-3 aspect-square w-2/3 rounded-full" />
                      <div className="skeleton mx-auto h-3 w-3/4 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : visibleArtists.length === 0 ? (
                view === "artists" ? (
                  <EmptyState title={`No artists found for “${debounced}”`} hint="Try another name or switch to All for song matches." />
                ) : null
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {visibleArtists.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setArtist(item)}
                      className="blur-panel group p-4 text-center transition-transform duration-200 hover:-translate-y-1"
                    >
                      <div className="mx-auto mb-3 w-2/3 overflow-hidden rounded-full ring-1 ring-white/5">
                        <Artwork src={item.avatar || undefined} alt={item.name} className="aspect-square w-full" rounded="rounded-full" />
                      </div>
                      <p className="truncate text-xs font-bold text-ink">{item.name}</p>
                      <p className="truncate text-[11px] text-ink3">{formatCount(item.followers)} followers</p>
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
