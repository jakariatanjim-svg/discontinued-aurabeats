import { Heart, ListMusic, Maximize2, Radio as RadioIcon, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/format";
import { usePlayer } from "@/hooks/usePlayer";
import { Artwork, IconButton, Slider } from "@/components/ui";
import { Visualizer } from "@/components/Visualizer";
import { usePlaybackClock } from "@/hooks/usePlayer";

export function PlayerBar({ onOpenQueue }: { onOpenQueue: () => void }) {
  const { currentTime, duration, bufferedAhead } = usePlaybackClock();
  const {
    current,
    isPlaying,
    isBuffering,
    isLive,
    volume,
    muted,
    shuffle,
    repeat,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    isFavorite,
    toggleFavorite,
    setExpanded,
    queue,
  } = usePlayer();

  const fav = current ? isFavorite(current.id) : false;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="blur-panel fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-45 rounded-none! border-x-0! border-b-0! px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:bottom-0 md:px-4 md:py-2.5 md:pb-2.5">
      {/* mobile progress line */}
      <div className="mb-1.5 md:hidden">
        <Slider
          ariaLabel="Seek"
          value={isLive ? 0 : currentTime}
          max={isLive ? 0 : duration}
          onChange={seek}
          height="h-1"
          disabled={isLive}
        />
      </div>

      <div className="flex items-center gap-3">
        {/* now playing */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group flex min-w-0 flex-1 items-center gap-3 text-left md:w-[22%] md:flex-none"
        >
          <div className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
            <Artwork
              src={current?.artwork || undefined}
              fallbackSrc={current?.artworkFallback}
              alt={current?.title ?? "AuraBeats"}
              className={cn("h-full w-full", isPlaying && "shadow-[0_0_24px_-6px_var(--c-accent)]")}
              rounded={isPlaying ? "rounded-full" : "rounded-lg"}
            />
            {isPlaying && (
              <span
                className={cn(
                  "pointer-events-none absolute -inset-[3px] rounded-full border-2 border-dashed border-accent/50",
                  isPlaying && "animate-spin-med",
                )}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[13px] font-bold text-ink sm:text-sm">
                {current?.title ?? "Nothing playing yet"}
              </p>
              {current?.isLive && (
                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-rose-400 uppercase sm:flex">
                  <RadioIcon className="h-2.5 w-2.5" /> live
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-ink3">
              {current ? current.artist : "Pick any track from the open network"}
            </p>
          </div>
          {current && (
            <IconButton
              size="sm"
              aria-label={fav ? "Remove favourite" : "Add favourite"}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(current);
              }}
              className={cn("shrink-0", fav ? "text-accent" : "opacity-60 hover:opacity-100")}
            >
              <Heart className={cn("h-4 w-4", fav && "fill-current")} />
            </IconButton>
          )}
        </button>

        {/* transport */}
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <IconButton
              size="sm"
              active={shuffle}
              onClick={toggleShuffle}
              aria-label="Shuffle"
              className="hidden sm:inline-flex"
            >
              <Shuffle className="h-4 w-4" />
            </IconButton>
            <IconButton onClick={previous} aria-label="Previous track">
              <SkipBack className="h-[18px] w-[18px] fill-current" />
            </IconButton>
            <button
              type="button"
              onClick={toggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={cn(
                "focus-ring relative flex h-11 w-11 items-center justify-center rounded-full bg-ink text-base transition-all duration-200 hover:scale-105 active:scale-95",
                isPlaying && "bg-accent text-white shadow-[0_0_26px_-4px_var(--c-accent)]",
              )}
            >
              {isBuffering ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 translate-x-[1px] fill-current" />
              )}
            </button>
            <IconButton onClick={next} aria-label="Next track">
              <SkipForward className="h-[18px] w-[18px] fill-current" />
            </IconButton>
            <IconButton size="sm" active={repeat !== "off"} onClick={cycleRepeat} aria-label="Repeat" className="hidden sm:inline-flex">
              {repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </IconButton>
          </div>

          {/* desktop seek row */}
          <div className="hidden w-full max-w-xl items-center gap-2.5 md:flex">
            <span className="w-10 text-right text-[11px] tabular-nums text-ink3">{isLive ? "LIVE" : formatTime(currentTime)}</span>
            <Slider
              ariaLabel="Seek"
              className="flex-1"
              value={isLive ? 0 : currentTime}
              max={isLive ? 0 : duration}
              buffered={bufferedAhead}
              onChange={seek}
              disabled={isLive}
            />
            <span className="w-10 text-[11px] tabular-nums text-ink3">{isLive ? "∞" : formatTime(duration)}</span>
          </div>
        </div>

        {/* right cluster */}
        <div className="flex items-center justify-end gap-1 md:w-[22%]">
          <div className="mr-1 hidden h-7 w-16 lg:block">
            <Visualizer variant="wave" barCount={28} active={isPlaying} />
          </div>
          <IconButton size="sm" onClick={onOpenQueue} aria-label="Queue" className="relative">
            <ListMusic className="h-4 w-4" />
            {queue.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-accent px-1 text-[9px] leading-[13px] font-bold text-white">
                {queue.length > 99 ? "99" : queue.length}
              </span>
            )}
          </IconButton>
          <div className="hidden items-center gap-1.5 md:flex">
            <IconButton size="sm" onClick={toggleMute} aria-label="Mute">
              <VolumeIcon className="h-4 w-4" />
            </IconButton>
            <div className="w-20 lg:w-28">
              <Slider ariaLabel="Volume" value={muted ? 0 : volume * 100} max={100} onChange={(v) => setVolume(v / 100)} height="h-1" />
            </div>
          </div>
          <IconButton size="sm" onClick={() => setExpanded(true)} aria-label="Expand player" className="hidden md:inline-flex">
            <Maximize2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
