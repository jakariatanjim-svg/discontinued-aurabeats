import { useMemo, useState } from "react";
import { Globe2, Radio as RadioIcon, RefreshCw, Signal } from "lucide-react";
import { useFeed } from "@/hooks/useFeed";
import { fetchStations, RADIO_COUNTRIES, RADIO_TAG_FEEDS } from "@/services/radio";
import { TrackRow, TrackRowSkeleton } from "@/components/TrackList";
import { Chip, IconButton, SectionHeader } from "@/components/ui";
import { EmptyState, ErrorState } from "@/components/states";
import { usePlayer } from "@/hooks/usePlayer";
import type { Track } from "@/types";

export function RadioView() {
  const [tag, setTag] = useState<string>("top");
  const [country, setCountry] = useState<string>("");
  const { playAll } = usePlayer();

  const key = `radio:${tag}:${country || "all"}`;
  const feed = useFeed<Track[]>(
    key,
    (signal) =>
      fetchStations({
        tag,
        country: country
          ? RADIO_COUNTRIES.find((c) => c.code === country)?.label
          : undefined,
        limit: 60,
        signal,
      }),
    { ttl: 6 * 60 * 1000 },
  );

  const stations = useMemo(() => feed.data ?? [], [feed.data]);

  return (
    <div className="space-y-6 pb-4">
      <div className="blur-panel relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -top-16 -right-10 h-52 w-52 rounded-full bg-rose-500/30 opacity-60 blur-3xl gradient-drift" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-rose-400 uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
              </span>
              Broadcasting now
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-ink sm:text-3xl">Open Live Radio</h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink3">
              Community-maintained archive of worldwide stations. Streams are direct HTTPS audio, checked continuously by
              the network — if one drops, AuraBeats hops to another automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs text-ink2">
              <Globe2 className="h-3.5 w-3.5 text-accent" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-transparent text-xs font-semibold text-ink outline-none"
                aria-label="Filter by country"
              >
                <option value="">All countries</option>
                {RADIO_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[var(--c-base)] text-ink">
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <IconButton onClick={feed.refresh} aria-label="Refresh stations">
              <RefreshCw className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      </div>

      <section>
        <SectionHeader title="Genres" subtitle="Live tag filters from the open archive" icon={<Signal className="h-4 w-4 text-accent" />} />
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {RADIO_TAG_FEEDS.map((t) => (
            <Chip key={t.value} active={tag === t.value} onClick={() => setTag(t.value)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title={stations.length > 0 ? `${stations.length} live stations` : "Loading stations…"}
          subtitle="Tap any station to tune in instantly"
          icon={<RadioIcon className="h-4 w-4 text-accent" />}
          action={
            stations.length > 0 ? (
              <button
                type="button"
                onClick={() => playAll(stations, 0)}
                className="rounded-full border border-line px-3 py-1.5 text-[11px] font-bold text-ink3 transition hover:border-accent hover:text-accent"
              >
                Shuffle all
              </button>
            ) : undefined
          }
        />
        {feed.loading && !feed.data ? (
          <TrackRowSkeleton rows={8} />
        ) : feed.error && !feed.data ? (
          <ErrorState message={feed.error} onRetry={feed.refresh} />
        ) : stations.length === 0 ? (
          <EmptyState title="No stations matched" hint="Try another genre or clear the country filter." />
        ) : (
          <div className="blur-panel p-2">
            {stations.map((s, i) => (
              <TrackRow key={s.id} track={s} context={stations} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
