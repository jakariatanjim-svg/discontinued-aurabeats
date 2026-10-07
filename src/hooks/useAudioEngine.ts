import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  initYouTubePlayer,
  playYouTubeVideo,
  pauseYouTubeVideo,
  seekYouTubeVideo,
  setYouTubeVolume,
  muteYouTubeVideo,
  unMuteYouTubeVideo,
  getYouTubeTime,
  getYouTubeDuration,
  getYouTubeBuffered
} from "@/services/youtubePlayer";

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
  endTick: number;
  errorTick: number;
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
  live?: boolean;
}

export function useAudioEngine(): AudioEngine {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isYtMode, setIsYtMode] = useState(false);
  const currentYtIdRef = useRef<string | null>(null);

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

  // Initialize YT Player
  useEffect(() => {
    initYouTubePlayer();
  }, []);

  if (!audioRef.current && typeof window !== "undefined") {
    const el = new Audio();
    el.preload = "auto";
    el.volume = 0.85;
    audioRef.current = el;
  }

  const load = useCallback((src: string, opts: LoadOptions = {}) => {
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setBufferedAhead(0);
    setIsBuffering(true);
    setIsLive(Boolean(opts.live));

    if (src.startsWith("yt-resolve:")) {
      const videoId = src.replace("yt-resolve:", "");
      setIsYtMode(true);
      currentYtIdRef.current = videoId;
      audioRef.current?.pause(); // Stop native audio
      
      initYouTubePlayer().then(() => {
        playYouTubeVideo(videoId);
      });
    } else {
      setIsYtMode(false);
      currentYtIdRef.current = null;
      pauseYouTubeVideo(); // Stop YT player

      const el = audioRef.current;
      if (el) {
        el.pause();
        el.removeAttribute("crossorigin");
        el.src = src;
        el.load();

        if (opts.autoplay !== false) {
          const p = el.play();
          if (p && typeof p.catch === "function") {
            p.catch((err: unknown) => {
              if (err instanceof Error && err.name === "NotAllowedError") {
                setBlockedTick((n) => n + 1);
                setError("Tap play to start — your browser blocked autoplay");
              }
              setIsBuffering(false);
            });
          }
        }
      }
    }
  }, []);

  const play = useCallback(async () => {
    if (isYtMode && currentYtIdRef.current) {
      playYouTubeVideo(currentYtIdRef.current);
    } else {
      try {
        await audioRef.current?.play();
      } catch (err) {
        if (err instanceof Error && err.name === "NotAllowedError") setBlockedTick((n) => n + 1);
        setError(err instanceof Error ? err.message : "Playback could not start");
      }
    }
  }, [isYtMode]);

  const pause = useCallback(() => {
    if (isYtMode) pauseYouTubeVideo();
    else audioRef.current?.pause();
  }, [isYtMode]);

  const toggle = useCallback(() => {
    if (isYtMode) {
      if (isPlaying) pauseYouTubeVideo();
      else playYouTubeVideo(currentYtIdRef.current!);
    } else {
      const el = audioRef.current;
      if (el) {
        if (el.paused) void play();
        else el.pause();
      }
    }
  }, [isYtMode, isPlaying, play]);

  const seek = useCallback((seconds: number) => {
    if (isYtMode) {
      seekYouTubeVideo(seconds);
      setCurrentTime(seconds);
    } else {
      const el = audioRef.current;
      if (el && Number.isFinite(seconds) && el.duration > 0) {
        try {
          el.currentTime = Math.min(Math.max(0, seconds), el.duration - 0.25);
          setCurrentTime(el.currentTime);
        } catch {}
      }
    }
  }, [isYtMode]);

  const nudge = useCallback((delta: number) => seek(currentTime + delta), [seek, currentTime]);

  const setVolume = useCallback((v: number) => {
    const nextV = Math.min(1, Math.max(0, v));
    setVolumeState(nextV);
    
    if (isYtMode) {
      setYouTubeVolume(nextV * 100);
    } else {
      const el = audioRef.current;
      if (el) {
        el.volume = nextV;
      }
    }
  }, [isYtMode]);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    if (isYtMode) {
      if (m) muteYouTubeVideo();
      else unMuteYouTubeVideo();
    } else {
      if (audioRef.current) audioRef.current.muted = m;
    }
  }, [isYtMode]);

  // Sync YouTube time
  useEffect(() => {
    if (!isYtMode) return;
    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentTime(getYouTubeTime());
        setDuration(getYouTubeDuration());
        setBufferedAhead(getYouTubeBuffered());
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isYtMode, isPlaying]);

  // Handle YouTube Events
  useEffect(() => {
    const handleStateChange = (e: any) => {
      const state = e.detail;
      // YT.PlayerState: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued).
      if (state === 1) {
        setIsPlaying(true);
        setIsBuffering(false);
        setError(null);
      } else if (state === 2) {
        setIsPlaying(false);
      } else if (state === 3) {
        setIsBuffering(true);
      } else if (state === 0) {
        setIsPlaying(false);
        setEndTick((n) => n + 1);
      }
    };

    const handleError = () => {
      setIsBuffering(false);
      setIsPlaying(false);
      setErrorTick((n) => n + 1);
      setError("This YouTube track cannot be played (region blocked or restricted).");
    };

    window.addEventListener("yt-state-change", handleStateChange);
    window.addEventListener("yt-error", handleError);
    return () => {
      window.removeEventListener("yt-state-change", handleStateChange);
      window.removeEventListener("yt-error", handleError);
    };
  }, []);

  // Native audio event listeners
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const syncDuration = () => {
      if (isYtMode) return;
      const d = el.duration;
      const live = !Number.isFinite(d) || d === 0 || d > 60 * 60 * 6;
      setIsLive(live);
      setDuration(live ? 0 : d);
    };

    const onPlay = () => { if (!isYtMode) { setIsPlaying(true); setError(null); } };
    const onPause = () => { if (!isYtMode) setIsPlaying(false); };
    const onPlaying = () => { if (!isYtMode) { setIsBuffering(false); setIsPlaying(true); setError(null); } };
    const onCanPlay = () => { if (!isYtMode) setIsBuffering(false); };
    const onWaiting = () => { if (!isYtMode) setIsBuffering(true); };
    const onTime = () => {
      if (!isYtMode) {
        setCurrentTime(el.currentTime);
        if (el.currentTime > 0) setIsBuffering(false);
      }
    };
    const onProgress = () => {
      if (!isYtMode) {
        try {
          if (el.buffered.length > 0) setBufferedAhead(el.buffered.end(el.buffered.length - 1));
        } catch {}
      }
    };
    const onEnded = () => { if (!isYtMode) { setIsPlaying(false); setEndTick((n) => n + 1); } };
    const onError = () => {
      if (!isYtMode) {
        setIsBuffering(false);
        setIsPlaying(false);
        setErrorTick((n) => n + 1);
        setError("This open stream could not be reached");
      }
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
  }, [isYtMode]);

  useEffect(() => () => {
    audioRef.current?.pause();
    pauseYouTubeVideo();
  }, []);

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
    ]
  );
}
