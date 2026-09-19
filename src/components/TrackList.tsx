import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListEnd,
  ListPlus,
  MoreHorizontal,
  Play,
  Plus,
  Radio as RadioIcon,
  Trash2,
  ExternalLink,
  Download,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatCount, formatTime, gradientFrom, relativeTime } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { Artwork, Button, Equalizer, IconButton, Modal } from "@/components/ui";
import type { Track } from "@/types";

/* --------------------------- contextual helpers --------------------------- */

function PlayOverlay({ playing, onClick, size = "md" }: { playing: boolean; onClick: (e: React.MouseEvent) => void; size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-12 w-12" } as const;
  const icons = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={playing ? "Pause" : "Play"}
      className={cn(
        "focus-ring flex items-center justify-center rounded-full bg-accent text-white shadow-lg transition-all duration-200",
        "translate-y-1 opacity-0 scale-90 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100 hover:brightness-110 active:scale-90",
        playing && "translate-y-0 opacity-100 scale-100",
        dims[size],
      )}
    >
      {playing ? <span className="h-3 w-3 rounded-[2px] bg-white" /> : <Play className={cn(icons[size], "translate-x-[1px] fill-current")} />}
    </button>
  );
}

function TrackMenu({
  track,
  context,
  onRemove,
  removeLabel,
}: {
  track: Track;
  context?: Track[];
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const { addToQueue, playNext, addToPlaylist, playlists, createPlaylist, downloadTrack, toast, settings } = usePlayer();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const width = 210;
      const left = Math.min(window.innerWidth - width - 12, Math.max(12, r.right - width));
      const flip = r.bottom + 240 > window.innerHeight;
      setPos({ top: flip ? Math.max(12, r.top - 230) : r.bottom + 6, left });
    };
    place();
    window.addEventListener("click", close);
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const items: { label: string; icon: ReactNode; run: () => void }[] = [
    { label: "Save to playlist", icon: <Plus className="h-4 w-4" />, run: () => setPickerOpen(true) },
    { label: "Download MP3", icon: <Download className="h-4 w-4" />, run: () => downloadTrack(track) },
  ];
  if (settings.queueEnabled) {
    items.unshift(
      { label: "Play next", icon: <ListEnd className="h-4 w-4" />, run: () => playNext(track) },
      { label: "Add to queue", icon: <ListPlus className="h-4 w-4" />, run: () => addToQueue(track) }
    );
  }
  if (track.homepage) {
    items.push({
      label: "Open source page",
      icon: <ExternalLink className="h-4 w-4" />,
      run: () => window.open(track.homepage, "_blank", "noopener,noreferrer"),
    });
  }
  if (onRemove) {
    items.push({ label: removeLabel ?? "Remove", icon: <Trash2 className="h-4 w-4" />, run: onRemove });
  }

  return (
    <>
      <IconButton
        ref={btnRef}
        size="sm"
        className="opacity-0 group-hover/row:opacity-100 focus:opacity-100 data-[open=true]:opacity-100"
        data-open={open}
        aria-label="Track options"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>

      {open && (
        <div
          className="blur-panel fixed z-[80] w-[210px] animate-scale-in overflow-hidden p-1.5 shadow-2xl"
          style={{ top: pos.top, left: pos.left }}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.run();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink2 transition hover:bg-ink/10 hover:text-ink"
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}

      <PlaylistPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        track={track}
        playlists={playlists}
        onPick={(id) => {
          addToPlaylist(id, context?.length ? context : track);
          setPickerOpen(false);
        }}
        onCreate={(name) => {
          const pl = createPlaylist(name, context?.length ? context : [track]);
          toast(`Saved to ${pl.name}`, "success");
          setPickerOpen(false);
        }}
      />
    </>
  );
}

export function PlaylistPicker({
  open,
  onClose,
  track,
  playlists,
  onPick,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  track?: Track;
  playlists: { id: string; name: string; tracks: Track[] }[];
  onPick: (playlistId: string) => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  useEffect(() => {
    if (open) setName("");
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title={track ? "Save to playlist" : "New playlist"}>
      <div className="max-h-[46vh] space-y-1 overflow-y-auto scroll-area pr-1">
        {playlists.length === 0 && (
          <p className="px-1 py-3 text-xs text-ink3">No playlists yet — create your first one below.</p>
        )}
        {playlists.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-ink/10"
          >
            <Artwork alt={p.name} src={p.tracks[0]?.artwork} className="h-10 w-10 shrink-0" rounded="rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{p.name}</span>
              <span className="block text-xs text-ink3">{p.tracks.length} tracks</span>
            </span>
          </button>
        ))}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate(name.trim());
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-full border border-line bg-ink/5 px-4 py-2 text-sm text-ink outline-none transition placeholder:text-ink3 focus:border-accent"
        />
        <Button type="submit" disabled={!name.trim()}>
          <Plus className="h-4 w-4" /> Create
        </Button>
      </form>
    </Modal>
  );
}

/* ------------------------------- Track row -------------------------------- */

export function TrackRow({
  track,
  context,
  index,
  onRemove,
  removeLabel,
  showArtwork = true,
  meta,
}: {
  track: Track;
  context?: Track[];
  index?: number;
  onRemove?: () => void;
  removeLabel?: string;
  showArtwork?: boolean;
  meta?: string;
}) {
  const { current, isPlaying, playNow, isFavorite, toggleFavorite } = usePlayer();
  const isCurrent = current?.id === track.id;
  const fav = isFavorite(track.id);

  return (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={() => playNow(track, context)}
      onKeyDown={(e) => {
        if (e.key === "Enter") playNow(track, context);
      }}
      className={cn(
        "group/row flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-200",
        isCurrent ? "bg-accent/10" : "hover:bg-ink/[0.07]",
      )}
    >
      {index !== undefined && (
        <span className="hidden w-6 shrink-0 justify-center text-xs tabular-nums text-ink3 sm:flex">
          {isCurrent && isPlaying ? <Equalizer active /> : index + 1}
        </span>
      )}

      {showArtwork && (
        <div className="group/art relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
          <Artwork
            src={track.artwork || undefined}
            fallbackSrc={track.artworkFallback}
            alt={track.title}
            className={cn("h-full w-full", isCurrent && isPlaying && "ring-1 ring-accent/60")}
            rounded="rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/45 opacity-0 transition group-hover/art:opacity-100">
            <PlayOverlay
              size="sm"
              playing={false}
              onClick={(e) => {
                e.stopPropagation();
                playNow(track, context);
              }}
            />
          </div>
        </div>
      )}

      <button type="button" onClick={() => playNow(track, context)} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={cn("truncate text-sm font-semibold", isCurrent ? "text-accent" : "text-ink")}>
            {track.title}
          </span>
          {track.isLive && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-400 uppercase">
              <RadioIcon className="h-2.5 w-2.5" /> live
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink3">
          <span className="truncate">{track.artist}</span>
          <span
            className="hidden shrink-0 rounded px-1 py-px text-[9px] font-bold tracking-wide text-ink3 uppercase opacity-70 ring-1 ring-current sm:inline"
            title={
              track.source === "archive"
                ? "Internet Archive · CC music"
                : track.source === "audius"
                  ? "Audius network · Indie"
                  : track.source === "jiosaavn"
                    ? "Direct music database"
                    : track.source === "jamendo"
                      ? "Independent CC library"
                      : track.source === "hearthis"
                        ? "HearThis · Indie"
                        : track.source === "youtube"
                          ? "YouTube Music mirror · 320kbps"
                          : "Open radio directory"
            }
          >
            {
              track.source === "archive" ? "archive" : 
              track.source === "audius" ? "indie net" : 
              track.source === "jiosaavn" ? "database" :
              track.source === "jamendo" ? "CC library" :
              track.source === "hearthis" ? "hearthis" :
              track.source === "youtube" ? "yt mirror" :
              "radio"
            }
          </span>
          {track.genre && !track.isLive && <span className="hidden shrink-0 opacity-60 md:inline">• {track.genre}</span>}
          {meta && <span className="shrink-0 opacity-60">• {meta}</span>}
        </div>
      </button>

      <div className="hidden items-center gap-3 pr-1 text-[11px] text-ink3 md:flex">
        {track.playCount !== undefined && track.playCount > 0 && <span>{formatCount(track.playCount)} plays</span>}
        {track.bitrate ? <span>{track.bitrate}kbps</span> : null}
      </div>

      <IconButton
        size="sm"
        aria-label={fav ? "Remove from favourites" : "Add to favourites"}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(track);
        }}
        className={cn("transition", fav ? "text-accent opacity-100" : "opacity-0 group-hover/row:opacity-100 focus:opacity-100")}
      >
        <Heart className={cn("h-4 w-4", fav && "fill-current")} />
      </IconButton>

      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink3">
        {track.isLive ? "∞" : formatTime(track.duration)}
      </span>

      <TrackMenu track={track} context={context} onRemove={onRemove} removeLabel={removeLabel} />
    </div>
  );
}

/* ------------------------------- Track card ------------------------------- */

export function TrackCard({ track, context }: { track: Track; context?: Track[] }) {
  const { playNow, current, isPlaying, toggleFavorite, isFavorite } = usePlayer();
  const isCurrent = current?.id === track.id;
  const fav = isFavorite(track.id);
  return (
    <div className="group/card blur-panel relative w-[10rem] shrink-0 p-2.5 transition-transform duration-300 hover:-translate-y-1 sm:w-[11.5rem] sm:p-3">
      <div className="relative mb-2.5 aspect-square w-full sm:mb-3">
        <Artwork
          src={track.artwork || undefined}
          fallbackSrc={track.artworkFallback}
          alt={track.title}
          className="h-full w-full shadow-lg"
        />
        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/65 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
          <IconButton
            size="sm"
            aria-label="Favourite"
            className={cn("bg-black/40 text-white backdrop-blur-md hover:bg-black/60", fav && "text-accent")}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(track);
            }}
          >
            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", fav && "fill-current")} />
          </IconButton>
          <PlayOverlay
            playing={isCurrent && isPlaying}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              playNow(track, context);
            }}
          />
        </div>
        {track.isLive && (
          <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-rose-600 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-white uppercase shadow sm:px-2 sm:text-[9px]">
            <RadioIcon className="h-2 w-2 sm:h-2.5 sm:w-2.5" /> live
          </span>
        )}
      </div>
      <button type="button" onClick={() => playNow(track, context)} className="block w-full min-w-0 text-left">
        <p className={cn("truncate text-[13px] font-bold sm:text-sm", isCurrent ? "text-accent" : "text-ink")}>{track.title}</p>
        <p className="mt-0.5 truncate text-[10px] text-ink3 sm:text-xs">{track.artist}</p>
      </button>
    </div>
  );
}

/* -------------------------------- Carousel -------------------------------- */

export function Carousel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className="group/car relative -mx-1">
      <div ref={ref} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-1 pb-1">
        {children}
      </div>
      {[-1, 1].map((dir) => (
        <button
          key={dir}
          type="button"
          aria-label={dir === -1 ? "Scroll left" : "Scroll right"}
          onClick={() => scrollBy(dir as 1 | -1)}
          className={cn(
            "blur-panel absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center text-ink opacity-0 transition group-hover/car:opacity-100 md:flex",
            dir === -1 ? "left-0" : "right-0",
          )}
        >
          {dir === -1 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Hero / feature ---------------------------- */

export function HeroCard({ track, context }: { track: Track; context?: Track[] }) {
  const { playNow, current, isPlaying } = usePlayer();
  const isCurrent = current?.id === track.id;
  return (
    <div className="blur-panel relative overflow-hidden p-5 sm:p-7">
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full opacity-40 blur-3xl gradient-drift"
        style={{ backgroundImage: gradientFrom(track.title) }}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative mx-auto w-40 shrink-0 sm:mx-0 sm:w-44">
          <Artwork
            src={track.artworkLarge || track.artwork || undefined}
            fallbackSrc={track.artworkFallback}
            alt={track.title}
            className={cn(
              "aspect-square w-full shadow-2xl",
              isCurrent && isPlaying && "animate-spin-slow glow-ring rounded-full",
            )}
            rounded={isCurrent && isPlaying ? "rounded-full" : "rounded-2xl"}
          />
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">Featured right now</p>
          <h2 className="mt-1.5 truncate text-2xl font-black tracking-tight text-ink text-glow sm:text-4xl">
            {track.title}
          </h2>
          <p className="mt-1 truncate text-sm text-ink2">
            {track.artist}
            {track.genre ? ` • ${track.genre}` : ""}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button onClick={() => playNow(track, context)} className="px-6 py-2.5">
              {isCurrent && isPlaying ? "Playing" : "Play now"}
            </Button>
            <span className="rounded-full border border-line px-3 py-1.5 text-[11px] text-ink3">
              {track.isLive ? "Live stream" : formatTime(track.duration)} • open network
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Section skeleton ---------------------------- */

export function TrackRowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <div className="skeleton h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-1/3 rounded-full" />
            <div className="skeleton h-2.5 w-1/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="blur-panel w-[10.5rem] shrink-0 p-3 sm:w-[11.5rem]">
          <div className="skeleton mb-3 aspect-square w-full rounded-xl" />
          <div className="skeleton mb-2 h-3 w-4/5 rounded-full" />
          <div className="skeleton h-2.5 w-1/2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AddedBadge({ ts }: { ts?: number }) {
  if (!ts) return null;
  return <span className="text-[11px] text-ink3">{relativeTime(ts)}</span>;
}
