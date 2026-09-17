import { useEffect, useRef, useState } from "react";
import { Loader2, Mic2, Search as SearchIcon, X, Music2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { useDebouncedValue, useFeed } from "@/hooks/useFeed";
import { fetchArtistTracks, searchArtists } from "@/services/audius";
import { searchEverything } from "@/services/catalog";
import { TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Artwork, Chip, SectionHeader, Spinner } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { formatCount } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import type { Artist, Track } from "@/types";

const SUGGESTIONS = [
  "lofi beats",
  "synthwave",
  "deep house",
  "chiptune",
  "ambient drone",
  "jazz trio",
  "piano solo",
  "drum and bass",
  "field recording",
  "garage rock",
];

export function SearchView() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"tracks" | "artists">("tracks");
  const debounced = useDebouncedValue(query.trim(), 420);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const { playAll } = usePlayer();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setArtist(null);
  }, [debounced]);

  const enabled = debounced.length >= 2;
  const tracks = useFeed<Track[]>(
    `search:${debounced}`,
    (signal) => searchEverything(debounced, { limit: 44, signal }),
    { enabled: enabled && tab === "tracks" },
  );
  const artists = useFeed<Artist[]>(
    `artists:${debounced}`,
    (signal) => searchArtists(debounced, { limit: 14, signal }),
    { enabled: enabled && tab === "artists" },
  );
  const artistTracks = useFeed<Track[]>(
    `artist-tracks:${artist?.handle ?? ""}`,
    (signal) => fetchArtistTracks(artist?.handle ?? "", { limit: 50, signal }),
    { enabled: Boolean(artist) },
  );

  return (
    <div className="space-y-6 pb-4">
      <div className="blur-panel flex items-center gap-2 p-2 pl-4">
        <SearchIcon className="h-4 w-4 shrink-0 text-accent" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search free full-length tracks across every open archive…"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink3"
          aria-label="Search the open music network"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="focus-ring rounded-full p-1.5 text-ink3 hover:bg-ink/10 hover:text-ink"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {enabled && (tab === "tracks" ? tracks.loading : artists.loading) && <Spinner className="mx-1 h-4 w-4" />}
      </div>

      {!enabled && (
        <div className="space-y-6">
          <section>
            <SectionHeader title="Try a search" subtitle="Live queries against the open catalogue" />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Chip key={s} onClick={() => setQuery(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </section>
          <EmptyState
            title="Search the open network"
            hint="Results come from free, key-less public music archives only — full songs, never 30-second previews, no account and no limits."
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
          <div className="blur-panel flex items-center gap-4 p-4">
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
          <div className="blur-panel p-2">
            {artistTracks.loading && !artistTracks.data ? (
              <TrackRowSkeleton rows={5} />
            ) : (
              (artistTracks.data ?? []).map((t, i) => (
                <TrackRow key={t.id} track={t} context={artistTracks.data ?? undefined} index={i} />
              ))
            )}
          </div>
        </div>
      )}

      {enabled && !artist && (
        <>
          <div className="blur-panel flex w-fit gap-1 p-1">
            {(
              [
                { key: "tracks", label: "Tracks", icon: Music2 },
                { key: "artists", label: "Artists", icon: Mic2 },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "focus-ring flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition",
                  tab === key ? "bg-accent text-white" : "text-ink3 hover:text-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "tracks" &&
            (tracks.error && !tracks.data ? (
              <ErrorState message={tracks.error} onRetry={tracks.refresh} />
            ) : tracks.loading && !tracks.data ? (
              <TrackRowSkeleton rows={8} />
            ) : (tracks.data ?? []).length === 0 ? (
              <EmptyState title={`No open tracks for "${debounced}"`} hint="Try a different spelling, genre or mood." />
            ) : (
              <div className="blur-panel p-2">
                {(tracks.data ?? []).map((t, i) => (
                  <TrackRow key={t.id} track={t} context={tracks.data ?? undefined} index={i} />
                ))}
              </div>
            ))}

          {tab === "artists" &&
            (artists.error && !artists.data ? (
              <ErrorState message={artists.error} onRetry={artists.refresh} />
            ) : artists.loading && !artists.data ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="blur-panel p-4">
                    <div className="skeleton mx-auto mb-3 aspect-square w-2/3 rounded-full" />
                    <div className="skeleton mx-auto h-3 w-3/4 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (artists.data ?? []).length === 0 ? (
              <EmptyState title={`No artists found for "${debounced}"`} hint="Try another name or switch to the Tracks tab." />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(artists.data ?? []).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setArtist(a)}
                    className="blur-panel group p-4 text-center transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="relative mx-auto mb-3 w-2/3">
                      <Artwork src={a.avatar || undefined} alt={a.name} className="aspect-square w-full" rounded="rounded-full" />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition group-hover:opacity-100">
                        <Loader2 className="hidden" />
                        <SearchIcon className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <p className="truncate text-xs font-bold text-ink">{a.name}</p>
                    <p className="truncate text-[11px] text-ink3">{formatCount(a.followers)} followers</p>
                  </button>
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
