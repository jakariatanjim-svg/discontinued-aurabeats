/**
 * useAudioEngine — the HTML5 Audio core.
 *
 * Deliberately kept "pure": the media element is NEVER given a `crossOrigin`
 * attribute and is NEVER routed through a Web Audio MediaElementSource.
 * Doing either makes the browser enforce a CORS pre-flight on every redirect
 * hop of a stream URL — public archive/CDN mirrors 302 across hosts, so any
 * strict hop silently kills playback (duration stays 0:00 and nothing plays).
 * Plain, un-tainted playback works with every free open source.
 *
 * The visualizer therefore runs on its organic simulation, which looks
 * identical to the user and can never break audio.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface AudioEngine {
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  bufferedAhead: number;
  volume: number;
  muted: boolean;
  isLive: boolean;
  error: string | null;
  /** increments every time the current stream reaches its natural end */
  endTick: number;
  /** increments every time the current stream raises a hard error */
  errorTick: number;
  /** increments when the browser blocks autoplay and needs a user gesture */
  blockedTick: number;
  load: (src: string, opts?: LoadOptions) => void;
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  nudge: (delta: number) => void;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
}

export interface LoadOptions {
  autoplay?: boolean;
  /** hint: endless stream, disables seeking/duration handling */
  live?: boolean;
}

export function useAudioEngine(): AudioEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedAhead, setBufferedAhead] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMutedState] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endTick, setEndTick] = useState(0);
  const [errorTick, setErrorTick] = useState(0);
  const [blockedTick, setBlockedTick] = useState(0);

  if (!audioRef.current && typeof window !== "undefined") {
    const el = new Audio();
    el.preload = "auto";
    el.volume = 0.85;
    // Never set crossOrigin — see the file header.
    audioRef.current = el;
  }

  const load = useCallback((src: string, opts: LoadOptions = {}) => {
    const el = audioRef.current;
    if (!el) return;
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setBufferedAhead(0);
    setIsBuffering(true);
    setIsLive(Boolean(opts.live));

    el.pause();
    el.removeAttribute("crossorigin");
    el.src = src;
    el.load();

    if (opts.autoplay !== false) {
      const p = el.play();
      if (p && typeof p.catch === "function") {
        p.catch((err: unknown) => {
          const name = err instanceof Error ? err.name : "";
          if (name === "NotAllowedError") {
            setBlockedTick((n) => n + 1);
            setError("Tap play to start — your browser blocked autoplay");
          }
          setIsBuffering(false);
        });
      }
    }
  }, []);

  const play = useCallback(async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      await el.play();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") setBlockedTick((n) => n + 1);
      setError(err instanceof Error ? err.message : "Playback could not start");
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void play();
    else el.pause();
  }, [play]);

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(seconds)) return;
    const d = el.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    try {
      el.currentTime = Math.min(Math.max(0, seconds), d - 0.25);
      setCurrentTime(el.currentTime);
    } catch {
      /* seeking not supported on this stream */
    }
  }, []);

  const nudge = useCallback(
    (delta: number) => {
      const el = audioRef.current;
      if (!el) return;
      seek(el.currentTime + delta);
    },
    [seek],
  );

  const setVolume = useCallback((v: number) => {
    const el = audioRef.current;
    const nextV = Math.min(1, Math.max(0, v));
    if (el) el.volume = nextV;
    setVolumeState(nextV);
    if (nextV > 0 && el?.muted) {
      el.muted = false;
      setMutedState(false);
    }
  }, []);

  const setMuted = useCallback((m: boolean) => {
    const el = audioRef.current;
    if (el) el.muted = m;
    setMutedState(m);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const syncDuration = () => {
      const d = el.duration;
      const live = !Number.isFinite(d) || d === 0 || d > 60 * 60 * 6;
      setIsLive(live);
      setDuration(live ? 0 : d);
    };

    const onPlay = () => {
      setIsPlaying(true);
      setError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onPlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      setError(null);
    };
    const onCanPlay = () => setIsBuffering(false);
    const onWaiting = () => setIsBuffering(true);
    const onTime = () => {
      setCurrentTime(el.currentTime);
      if (el.currentTime > 0) setIsBuffering(false);
    };
    const onProgress = () => {
      try {
        if (el.buffered.length > 0) setBufferedAhead(el.buffered.end(el.buffered.length - 1));
      } catch {
        /* ignore */
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setEndTick((n) => n + 1);
    };
    const onError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setErrorTick((n) => n + 1);
      const code = el.error?.code;
      const messages: Record<number, string> = {
        1: "Loading aborted",
        2: "Network error while fetching the stream",
        3: "Stream could not be decoded",
        4: "Stream unavailable in this format",
      };
      setError(code && messages[code] ? messages[code] : "This open stream could not be reached");
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("canplaythrough", onCanPlay);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("stalled", onWaiting);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", syncDuration);
    el.addEventListener("durationchange", syncDuration);
    el.addEventListener("progress", onProgress);
    el.addEventListener("ended", onEnded);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("canplaythrough", onCanPlay);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("stalled", onWaiting);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", syncDuration);
      el.removeEventListener("durationchange", syncDuration);
      el.removeEventListener("progress", onProgress);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => () => audioRef.current?.pause(), []);

  return useMemo(
    () => ({
      isPlaying,
      isBuffering,
      currentTime,
      duration,
      bufferedAhead,
      volume,
      muted,
      isLive,
      error,
      endTick,
      errorTick,
      blockedTick,
      load,
      play,
      pause,
      toggle,
      seek,
      nudge,
      setVolume,
      setMuted,
    }),
    [
      isPlaying,
      isBuffering,
      currentTime,
      duration,
      bufferedAhead,
      volume,
      muted,
      isLive,
      error,
      endTick,
      errorTick,
      blockedTick,
      load,
      play,
      pause,
      toggle,
      seek,
      nudge,
      setVolume,
      setMuted,
    ],
  );
}
