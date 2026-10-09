import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Flame,
  Heart,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import {
  fetchForYou,
  fetchFresh,
  fetchGenre,
  fetchPopular,
  GENRE_CHIPS,
} from "@/services/catalog";
import { CardSkeleton, Carousel, HeroCard, TrackCard, TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Chip, IconButton, SectionHeader } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { usePlayer } from "@/hooks/usePlayer";
import type { Track } from "@/types";

function useEnteredViewport<T extends HTMLElement>(rootMargin = "560px 0px") {
  const ref = useRef<T | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (entered) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [entered, rootMargin]);

  return [ref, entered] as const;
}

export function HomeView({ onNavigate }: { onNavigate: (r: "radio" | "search") => void }) {
  const { playAll, toast, favorites } = usePlayer();
  const [genre, setGenre] = useState<string>(GENRE_CHIPS[0].value);

  const [forYouRef, forYouReady] = useEnteredViewport<HTMLElement>();
  const [freshRef, freshReady] = useEnteredViewport<HTMLElement>();
  const [genreRef, genreReady] = useEnteredViewport<HTMLElement>();

  // Personalized "For You" — derived from favourites
  const forYouKey = useMemo(
    () => favorites.slice(0, 10).map((t) => t.artist).join("|"),
    [favorites],
  );
  const forYou = useFeed<Track[]>(
    `cat:foryou:${forYouKey}`,
    () => fetchForYou(favorites),
    { enabled: favorites.length > 0 && forYouReady },
  );

  const popular = useFeed<Track[]>("cat:popular", (signal) => fetchPopular({ limit: 18, signal }));
  const fresh = useFeed<Track[]>("cat:fresh", (signal) => fetchFresh({ limit: 14, signal }), { enabled: freshReady });
  const genreFeed = useFeed<Track[]>(`cat:genre:${genre}`, (signal) => fetchGenre(genre, { limit: 14, signal }), {
    enabled: genreReady,
  });

  const hero = useMemo(() => {
    const list = popular.data ?? [];
    if (list.length === 0) return null;
    const slot = Math.floor(Date.now() / (1000 * 60 * 20)) % Math.min(6, list.length);
    return list[slot];
  }, [popular.data]);

  const playSection = (tracks: Track[] | null, label: string) => {
    if (!tracks || tracks.length === 0) {
      toast("Still loading — try again in a second", "info");
      return;
    }
    playAll(tracks, 0);
    toast(`Playing ${label}`, "success");
  };

  return (
    <div className="space-y-10 pb-12 sm:space-y-14">
      {/* 1. Primary Chart (Spotify Style) */}
      <section id="home-popular" className="animate-fade-in pt-2">
        <SectionHeader
          title="Trending Songs"
          subtitle="Top tracks across all platforms"
          icon={<TrendingUp className="h-5 w-5 text-accent" />}
          action={
            <IconButton onClick={popular.refresh} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </IconButton>
          }
        />
        {popular.loading && !popular.data ? (
          <CardSkeleton />
        ) : popular.error && !popular.data ? (
          <ErrorState message={popular.error} onRetry={popular.refresh} />
        ) : (
          <Carousel>
            {(popular.data ?? []).map((t) => (
              <TrackCard key={t.id} track={t} context={popular.data ?? undefined} />
            ))}
          </Carousel>
        )}
      </section>

      {/* 2. Featured Right Now */}
      {hero && !popular.loading && (
        <section className="animate-fade-up">
           <HeroCard track={hero} context={popular.data ?? [hero]} />
        </section>
      )}

      {/* 3. Quick Navigation Tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickAction
          title="Popular Mix"
          hint="Hottest hits"
          tint="bg-accent/15 text-accent"
          icon={<TrendingUp className="h-5 w-5" />}
          onClick={() => playSection(popular.data, "trending hits")}
        />
        <QuickAction
          title="Fresh Drops"
          hint="Newly released"
          tint="bg-cyan-500/15 text-cyan-400"
          icon={<Flame className="h-5 w-5" />}
          onClick={() => playSection(fresh.data, "fresh releases")}
        />
        <QuickAction
          title="Live Radio"
          hint="Global streams"
          tint="bg-rose-500/15 text-rose-400"
          icon={<Radio className="h-5 w-5" />}
          onClick={() => onNavigate("radio")}
        />
        <QuickAction
          title="Deep Search"
          hint="Find anything"
          tint="bg-violet-500/15 text-violet-300"
          icon={<Search className="h-5 w-5" />}
          onClick={() => onNavigate("search")}
        />
      </div>

      {/* 4. For You (Dynamic) */}
      {favorites.length > 0 && (
        <section ref={forYouRef}>
          <SectionHeader
            title="For You"
            subtitle="Based on your favourites"
            icon={<Heart className="h-4 w-4 text-rose-400" />}
            action={
              <div className="flex items-center gap-2">
                <IconButton onClick={forYou.refresh} aria-label="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </IconButton>
                <button
                  type="button"
                  onClick={() => playSection(forYou.data, "your personalised mix")}
                  className="rounded-full border border-line px-3.5 py-1.5 text-[11px] font-bold text-ink3 transition hover:border-accent hover:text-accent"
                >
                  Play all
                </button>
              </div>
            }
          />
          {!forYouReady ? (
            <div className="h-40 rounded-3xl border border-dashed border-line" />
          ) : forYou.loading && !forYou.data ? (
            <CardSkeleton />
          ) : forYou.error && !forYou.data ? (
            <ErrorState message={forYou.error} onRetry={forYou.refresh} />
          ) : forYou.data && forYou.data.length > 0 ? (
            <Carousel>
              {forYou.data.map((t) => (
                <TrackCard key={t.id} track={t} context={forYou.data ?? undefined} />
              ))}
            </Carousel>
          ) : null}
        </section>
      )}

      {/* 5. Fresh Releases (On Demand) */}
      <section ref={freshRef}>
        <SectionHeader
          title="Fresh Releases"
          subtitle="New tracks discovered live"
          icon={<Flame className="h-4 w-4 text-accent2" />}
          action={
            <IconButton onClick={fresh.refresh} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </IconButton>
          }
        />
        {!freshReady ? (
          <div className="h-40 rounded-3xl border border-dashed border-line" />
        ) : fresh.loading && !fresh.data ? (
          <CardSkeleton />
        ) : fresh.error && !fresh.data ? (
          <ErrorState message={fresh.error} onRetry={fresh.refresh} />
        ) : (
          <Carousel>
            {(fresh.data ?? []).map((t) => (
              <TrackCard key={t.id} track={t} context={fresh.data ?? undefined} />
            ))}
          </Carousel>
        )}
      </section>

      {/* 6. Genre Rows (On Demand) */}
      <section id="home-genres" ref={genreRef}>
        <SectionHeader
          title="Browse by Genre"
          subtitle="Explore the audio web"
          icon={<Sparkles className="h-4 w-4 text-accent" />}
          action={
            <button
              type="button"
              onClick={() => playSection(genreFeed.data, `${genre} selection`)}
              className="rounded-full border border-line px-3.5 py-1.5 text-[11px] font-bold text-ink3 transition hover:border-accent hover:text-accent"
            >
              Play all
            </button>
          }
        />
        <div className="no-scrollbar -mx-2 mb-3.5 flex gap-2.5 overflow-x-auto px-2 pb-1.5">
          {GENRE_CHIPS.map((g) => (
            <Chip key={g.value} active={genre === g.value} onClick={() => setGenre(g.value)}>
              {g.label}
            </Chip>
          ))}
        </div>
        {!genreReady ? (
          <div className="h-60 rounded-3xl border border-dashed border-line" />
        ) : genreFeed.loading && !genreFeed.data ? (
          <TrackRowSkeleton rows={6} />
        ) : genreFeed.error && !genreFeed.data ? (
          <ErrorState message={genreFeed.error} onRetry={genreFeed.refresh} />
        ) : (genreFeed.data ?? []).length === 0 ? (
          <EmptyState title="No tracks found" hint="Try another genre chip." />
        ) : (
          <div className="blur-panel overflow-hidden rounded-[1.4rem] p-1.5 sm:p-2.5">
            {(genreFeed.data ?? []).slice(0, 8).map((t, i) => (
              <TrackRow key={t.id} track={t} context={genreFeed.data ?? undefined} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  title,
  hint,
  icon,
  tint,
  onClick,
}: {
  title: string;
  hint: string;
  icon: ReactNode;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="blur-panel glass-inset flex items-center gap-3 rounded-[1.35rem] p-3 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_var(--c-accent)] sm:p-3.5"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold text-ink sm:text-sm">{title}</span>
        <span className="block truncate text-[10px] text-ink3 sm:text-[11px]">{hint}</span>
      </span>
    </button>
  );
}
