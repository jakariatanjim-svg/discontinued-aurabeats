import { useMemo, useState } from "react";
import { Disc3, Flame, Radio, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import {
  ARCHIVE_COLLECTIONS,
  fetchCollection,
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

export function HomeView({ onNavigate }: { onNavigate: (r: "radio" | "search") => void }) {
  const { playAll, toast } = usePlayer();
  const [genre, setGenre] = useState<string>(GENRE_CHIPS[0].value);

  const popular = useFeed<Track[]>("cat:popular", (signal) => fetchPopular({ limit: 34, signal }));
  const fresh = useFeed<Track[]>("cat:fresh", (signal) => fetchFresh({ limit: 26, signal }));
  const genreFeed = useFeed<Track[]>(`cat:genre:${genre}`, (signal) => fetchGenre(genre, { limit: 26, signal }));

  const hero = useMemo(() => {
    const list = popular.data ?? [];
    if (list.length === 0) return null;
    const slot = Math.floor(Date.now() / (1000 * 60 * 20)) % Math.min(8, list.length);
    return list[slot];
  }, [popular.data]);

  const playSection = (tracks: Track[] | null, label: string) => {
    if (!tracks || tracks.length === 0) {
      toast("That feed is still loading — try again in a second", "info");
      return;
    }
    playAll(tracks, 0);
    toast(`Playing ${label}`, "success");
  };

  return (
    <div className="space-y-8 pb-4">
      {/* Clean hero — no clutter, just CTA */}
      <section className="blur-panel glass-inset overflow-hidden rounded-[2rem] px-6 py-8 sm:px-10 sm:py-12" id="home-hero">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.05] px-3.5 py-1.5 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink2">
            Free open music player
          </span>
        </div>
        <h1 className="mb-3 max-w-3xl text-balance text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Stream open music and live radio.
        </h1>
        <p className="mb-7 max-w-2xl text-sm font-medium leading-7 text-ink2 sm:text-base">
          Five live sources. No accounts. No previews. Full tracks, instantly.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="#home-popular"
            className="focus-ring rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-[0_14px_34px_-16px_var(--c-accent)] transition hover:brightness-110 active:scale-95"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("home-popular")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Start listening
          </a>
          <a
            href="#home-search"
            className="focus-ring rounded-full border border-line bg-white/[0.03] px-6 py-3 text-sm font-bold text-ink transition hover:border-accent hover:text-accent active:scale-95"
            onClick={(e) => { e.preventDefault(); onNavigate("search"); }}
          >
            Search tracks
          </a>
          <a
            href="#home-radio"
            className="focus-ring rounded-full border border-line bg-white/[0.03] px-6 py-3 text-sm font-bold text-ink transition hover:border-accent hover:text-accent active:scale-95"
            onClick={(e) => { e.preventDefault(); onNavigate("radio"); }}
          >
            Live radio
          </a>
        </div>
      </section>

      {popular.loading && !popular.data ? (
        <div className="blur-panel p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="skeleton mx-auto aspect-square w-40 rounded-2xl sm:mx-0 sm:w-44" />
            <div className="flex-1 space-y-3">
              <div className="skeleton h-3 w-28 rounded-full" />
              <div className="skeleton h-8 w-3/4 rounded-full" />
              <div className="skeleton h-3 w-1/3 rounded-full" />
              <div className="skeleton h-9 w-40 rounded-full" />
            </div>
          </div>
        </div>
      ) : popular.error && !popular.data ? (
        <ErrorState message={popular.error} onRetry={popular.refresh} />
      ) : (
        hero && <HeroCard track={hero} context={popular.data ?? [hero]} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <QuickAction
          title="Popular Mix"
          hint="The hottest open hits"
          tint="bg-accent/15 text-accent"
          icon={<TrendingUp className="h-5 w-5" />}
          onClick={() => playSection(popular.data, "the open popularity chart")}
        />
        <QuickAction
          title="Fresh Drops"
          hint="Newly released gems"
          tint="bg-accent2/15 text-accent2"
          icon={<Flame className="h-5 w-5" />}
          onClick={() => playSection(fresh.data, "fresh open releases")}
        />
        <QuickAction
          title="Live Radio"
          hint="Global stream network"
          tint="bg-rose-500/15 text-rose-400"
          icon={<Radio className="h-5 w-5" />}
          onClick={() => onNavigate("radio")}
        />
        <QuickAction
          title="Deep Search"
          hint="Find anything instantly"
          tint="bg-violet-500/15 text-violet-300"
          icon={<Sparkles className="h-5 w-5" />}
          onClick={() => onNavigate("search")}
        />
      </div>

      <section id="home-popular">
        <SectionHeader
          title="Popular on AuraBeats"
          subtitle={
            popular.data
              ? `${popular.data.length} full-length tracks · no limits`
              : "Connecting to open archives…"
          }
          icon={<TrendingUp className="h-4 w-4 text-accent" />}
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

      <section>
        <SectionHeader
          title="Fresh Releases"
          subtitle="Independent creators · Artist-approved streams"
          icon={<Flame className="h-4 w-4 text-accent2" />}
          action={
            <IconButton onClick={fresh.refresh} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </IconButton>
          }
        />
        {fresh.loading && !fresh.data ? (
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

      <section id="home-genres">
        <SectionHeader
          title="Browse by Genre"
          subtitle="Live exploration across the decentralised web"
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
        {genreFeed.loading && !genreFeed.data ? (
          <TrackRowSkeleton rows={6} />
        ) : genreFeed.error && !genreFeed.data ? (
          <ErrorState message={genreFeed.error} onRetry={genreFeed.refresh} />
        ) : (genreFeed.data ?? []).length === 0 ? (
          <EmptyState title="No open tracks in that genre right now" hint="Pick another genre chip." />
        ) : (
          <div className="blur-panel overflow-hidden p-1.5 sm:p-2.5">
            {(genreFeed.data ?? []).slice(0, 10).map((t, i) => (
              <TrackRow key={t.id} track={t} context={genreFeed.data ?? undefined} index={i} />
            ))}
          </div>
        )}
      </section>

      <section id="home-collections">
        <SectionHeader
          title="Open Collections"
          subtitle="Infinite free archives, one tap away"
          icon={<Disc3 className="h-4 w-4 text-accent" />}
        />
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {ARCHIVE_COLLECTIONS.map((c) => (
            <CollectionRow key={c.slug} slug={c.slug} label={c.label} blurb={c.blurb} />
          ))}
        </div>
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
  icon: React.ReactNode;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="blur-panel glass-inset flex items-center gap-3 p-3 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_var(--c-accent)]"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold text-ink">{title}</span>
        <span className="block truncate text-[10px] text-ink3">{hint}</span>
      </span>
    </button>
  );
}

function CollectionRow({ slug, label, blurb }: { slug: string; label: string; blurb: string }) {
  const { playAll, toast } = usePlayer();
  const [pending, setPending] = useState(false);

  const go = async () => {
    setPending(true);
    try {
      const tracks = await fetchCollection(slug, { limit: 40 });
      if (tracks.length === 0) {
        toast(`No playable items in ${label} right now`, "error");
      } else {
        playAll(tracks, 0);
        toast(`${label} — ${tracks.length} full tracks queued`, "success");
      }
    } catch {
      toast("Open archive unreachable — retrying another mirror next time", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className="blur-panel group flex items-center gap-3 p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
        <Disc3 className={pending ? "h-5 w-5 animate-spin" : "h-5 w-5"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink">{label}</span>
        <span className="block truncate text-[11px] text-ink3">{pending ? "Loading full tracks…" : blurb}</span>
      </span>
    </button>
  );
}
