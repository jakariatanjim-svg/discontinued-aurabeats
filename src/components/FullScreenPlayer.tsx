import { useEffect } from "react";
import {
  ChevronDown,
  Heart,
  Loader2,
  Pause,
  Play,
  Radio as RadioIcon,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatTime, gradientFrom } from "@/utils/format";
import { usePlaybackClock, usePlayer } from "@/hooks/usePlayer";
import { Artwork, IconButton, Slider } from "@/components/ui";
import { Visualizer } from "@/components/Visualizer";
import { TrackRow } from "@/components/TrackList";

export function FullScreenPlayer() {
  const { currentTime, duration, bufferedAhead } = usePlaybackClock();
  const {
    current,
    queue,
    index,
    isPlaying,
    isBuffering,
    isLive,
    volume,
    muted,
    shuffle,
    repeat,
    expanded,
    setExpanded,
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
    jumpTo,
    playNow,
  } = usePlayer();

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  if (!expanded || !current) return null;
  const fav = isFavorite(current.id);
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed inset-0 z-[85] animate-fade-in overflow-hidden">
      {/* backdrop */}
      <div className="absolute inset-0 -z-10">
        {current.artworkLarge || current.artwork ? (
          <img
            src={current.artworkLarge || current.artwork}
            alt=""
            className="h-full w-full scale-125 object-cover opacity-40 blur-3xl"
          />
        ) : (
          <div className="h-full w-full" style={{ backgroundImage: gradientFrom(current.title) }} />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="absolute inset-0 opacity-45 gradient-drift"
          style={{ backgroundImage: "linear-gradient(120deg, var(--c-accent), transparent 55%, var(--c-accent2))" }}
        />
      </div>

      <div className="relative flex h-full flex-col">
        <div className="flex items-center justify-between px-4 pt-4 sm:px-8">
          <IconButton onClick={() => setExpanded(false)} aria-label="Close full screen" className="text-white/80 hover:text-white">
            <ChevronDown className="h-5 w-5" />
          </IconButton>
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-[0.28em] text-white/60 uppercase">
              {current.isLive ? "Live broadcast" : "Now playing"}
            </p>
            <p className="mt-0.5 text-[11px] text-white/50">
              {current.source === "audius" ? "Open music network" : "Open radio archive"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center">
            {current.isLive && (
              <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                <RadioIcon className="h-3 w-3" /> live
              </span>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto scroll-area px-4 pt-4 pb-6 sm:px-8 lg:flex-row lg:items-stretch lg:gap-10">
          {/* left: art + controls */}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-5">
            <div className="relative w-[min(70vw,17rem)] sm:w-[min(46vh,20rem)]">
              <div
                className={cn(
                  "absolute -inset-6 -z-10 rounded-full opacity-60 blur-3xl gradient-drift transition-opacity",
                  isPlaying ? "opacity-70" : "opacity-30",
                )}
                style={{ backgroundImage: gradientFrom(current.title) }}
              />
              <Artwork
                src={current.artworkLarge || current.artwork || undefined}
                fallbackSrc={current.artworkFallback}
                alt={current.title}
                className={cn(
                  "aspect-square w-full shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] transition-transform duration-700",
                  isPlaying && "scale-[1.02]",
                )}
                rounded={isPlaying ? "rounded-full" : "rounded-3xl"}
              />
              {isPlaying && (
                <span className="pointer-events-none absolute -inset-3 animate-spin-slow rounded-full border border-dashed border-white/25" />
              )}
            </div>

            <div className="w-full max-w-xl text-center">
              <h2 className="truncate text-2xl font-black tracking-tight text-white text-glow sm:text-4xl">
                {current.title}
              </h2>
              <p className="mt-1.5 truncate text-sm text-white/70 sm:text-base">
                {current.artist}
                {current.genre ? ` • ${current.genre}` : ""}
                {current.mood ? ` • ${current.mood}` : ""}
              </p>
              {current.tags && current.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {current.tags.slice(0, 4).map((t) => (
                    <span key={t} className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] text-white/70">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="h-14 w-full max-w-xl">
              <Visualizer variant="mirror" barCount={56} active={isPlaying} />
            </div>

            <div className="w-full max-w-xl">
              <Slider
                ariaLabel="Seek"
                value={isLive ? 0 : currentTime}
                max={isLive ? 0 : duration}
                buffered={bufferedAhead}
                onChange={seek}
                height="h-1.5"
                disabled={isLive}
              />
              <div className="flex justify-between text-[11px] tabular-nums text-white/60">
                <span>{isLive ? "LIVE" : formatTime(currentTime)}</span>
                <span>{isLive ? "uninterrupted stream" : formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex w-full max-w-xl items-center justify-center gap-3 sm:gap-5">
              <IconButton
                active={shuffle}
                onClick={toggleShuffle}
                aria-label="Shuffle"
                className="text-white/70 hover:text-white"
              >
                <Shuffle className="h-[18px] w-[18px]" />
              </IconButton>
              <IconButton onClick={previous} aria-label="Previous" className="text-white hover:bg-white/10">
                <SkipBack className="h-7 w-7 fill-current" />
              </IconButton>
              <button
                type="button"
                onClick={toggle}
                aria-label={isPlaying ? "Pause" : "Play"}
                className={cn(
                  "focus-ring flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform hover:scale-105 active:scale-95",
                  isPlaying && "shadow-[0_0_44px_-6px_var(--c-accent)]",
                )}
              >
                {isBuffering ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="h-7 w-7 translate-x-[2px] fill-current" />
                )}
              </button>
              <IconButton onClick={next} aria-label="Next" className="text-white hover:bg-white/10">
                <SkipForward className="h-7 w-7 fill-current" />
              </IconButton>
              <IconButton
                active={repeat !== "off"}
                onClick={cycleRepeat}
                aria-label="Repeat"
                className="text-white/70 hover:text-white"
              >
                {repeat === "one" ? <Repeat1 className="h-[18px] w-[18px]" /> : <Repeat className="h-[18px] w-[18px]" />}
              </IconButton>
            </div>

            <div className="flex w-full max-w-xl items-center justify-center gap-3">
              <IconButton
                aria-label="Favourite"
                onClick={() => toggleFavorite(current)}
                className={cn("text-white/70 hover:text-white", fav && "text-accent")}
              >
                <Heart className={cn("h-5 w-5", fav && "fill-current")} />
              </IconButton>
              <IconButton onClick={toggleMute} aria-label="Mute" className="text-white/70 hover:text-white">
                <VolumeIcon className="h-5 w-5" />
              </IconButton>
              <div className="w-32 sm:w-44">
                <Slider ariaLabel="Volume" value={muted ? 0 : volume * 100} max={100} onChange={(v) => setVolume(v / 100)} height="h-1" />
              </div>
            </div>
          </div>

          {/* right: up next */}
          <div className="blur-panel w-full shrink-0 self-start p-3 lg:w-[23rem]">
            <p className="mb-2 px-1 text-[10px] font-bold tracking-[0.18em] text-white/50 uppercase">
              Up next · {Math.max(0, queue.length - index - 1)} queued
            </p>
            <div className="max-h-[38vh] space-y-0.5 overflow-y-auto scroll-area pr-1 lg:max-h-[calc(100vh-14rem)]">
              {queue.slice(index + 1, index + 40).map((t, i) => (
                <button
                  key={`${t.id}-${i}`}
                  type="button"
                  onClick={() => jumpTo(index + 1 + i)}
                  className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/10"
                >
                  <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-white/40">{i + 1}</span>
                  <Artwork
                    src={t.artwork || undefined}
                    fallbackSrc={t.artworkFallback}
                    alt={t.title}
                    className="h-9 w-9 shrink-0"
                    rounded="rounded-lg"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white/90">{t.title}</span>
                    <span className="block truncate text-[11px] text-white/45">{t.artist}</span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-white/40">
                    {t.isLive ? "∞" : formatTime(t.duration)}
                  </span>
                </button>
              ))}
              {queue.length - index - 1 <= 0 && (
                <div className="p-4 text-center text-xs text-white/50">
                  Queue is empty — play something else to keep the vibe going.
                </div>
              )}
            </div>
            {queue.length > 1 && (
              <button
                type="button"
                onClick={() => playNow(queue[(index + 1) % queue.length], queue)}
                className="mt-2 w-full rounded-xl border border-white/20 py-2 text-xs font-bold text-white/80 transition hover:border-accent hover:text-accent"
              >
                Jump to next track
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QueuePanel() {
  const { queue, index, queueOpen, setQueueOpen, removeFromQueue, clearQueue, playAll, current } = usePlayer();
  return (
    <>
      {queueOpen && <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setQueueOpen(false)} />}
      <aside
        className={cn(
          "blur-panel fixed top-0 right-0 z-[61] flex h-full w-[min(92vw,22rem)] flex-col rounded-none! border-y-0! border-r-0! shadow-2xl transition-transform duration-300",
          queueOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <div>
            <p className="text-sm font-bold text-ink">Playback queue</p>
            <p className="text-[11px] text-ink3">{queue.length} tracks loaded</p>
          </div>
          <div className="flex gap-1">
            {queue.length > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold text-ink3 transition hover:border-accent hover:text-accent"
              >
                Clear
              </button>
            )}
            <IconButton size="sm" onClick={() => setQueueOpen(false)} aria-label="Close queue">
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-area p-2">
          {queue.length === 0 && (
            <p className="p-6 text-center text-xs text-ink3">
              Nothing queued. Add tracks from any list using the ••• menu.
            </p>
          )}
          {queue[index] && (
            <>
              <p className="px-2 pt-1 pb-1 text-[10px] font-bold tracking-[0.16em] text-accent uppercase">Playing now</p>
              <div className="mb-2 rounded-xl bg-accent/10 p-1.5">
                <TrackRow track={queue[index]} context={queue} showArtwork />
              </div>
            </>
          )}
          {queue.length > index + 1 && (
            <>
              <p className="px-2 pt-2 pb-1 text-[10px] font-bold tracking-[0.16em] text-ink3 uppercase">Next up</p>
              <div className="space-y-0.5">
                {queue.slice(index + 1).map((t, i) => (
                  <div key={`${t.id}-${i}`} className="group/row">
                    <TrackRow
                      track={t}
                      context={queue}
                      index={i}
                      onRemove={() => removeFromQueue(index + 1 + i)}
                      removeLabel="Remove from queue"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {queue.length > 1 && (
          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={() => playAll(queue, index)}
              className="w-full rounded-xl bg-accent py-2 text-xs font-bold text-white transition hover:brightness-110"
            >
              Restart queue from {current?.title.slice(0, 18) ?? "start"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
