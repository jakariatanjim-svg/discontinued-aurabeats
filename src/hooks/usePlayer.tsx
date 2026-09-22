/**
 * usePlayer — the global music player brain.
 * Owns the queue, playback order (shuffle/repeat), favourites, user playlists,
 * listening history, volume preferences and the automatic stream fail-over
 * engine. Everything user-specific is mirrored into localStorage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAudioEngine, type AudioEngine } from "@/hooks/useAudioEngine";
import { reportListen } from "@/services/radio";
import { resolveStreamUrls } from "@/services/youtube";
import { storage, session } from "@/utils/storage";
import { shuffleArray, uid } from "@/utils/format";
import type { RepeatMode, ToastMessage, Track, UserPlaylist, PlayerSettings } from "@/types";

/**
 * Resolve a stream URL — if it's a lazy `yt-resolve:ID` placeholder,
 * contact the mirror pool and return fresh playable URLs.
 */
async function resolveLazyUrl(track: Track): Promise<string[]> {
  const primary = track.streamUrl;
  if (primary.startsWith("yt-resolve:")) {
    const videoId = primary.slice("yt-resolve:".length);
    const { urls } = await resolveStreamUrls(videoId);
    return urls;
  }
  return track.fallbackUrls.length > 0 ? track.fallbackUrls : [primary];
}

const HISTORY_LIMIT = 80;

/** Frequently-changing playback clock, isolated so list views never re-render on timeupdate. */
export interface PlaybackClock {
  currentTime: number;
  duration: number;
  bufferedAhead: number;
  isLive: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
}

const ClockContext = createContext<PlaybackClock | null>(null);
const EngineContext = createContext<AudioEngine | null>(null);

/** Sub-second playback clock — only used by the transport surfaces. */
export function usePlaybackClock(): PlaybackClock {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error("usePlaybackClock must be used inside <PlayerProvider>");
  return ctx;
}

/** Direct access to the audio engine (stable callbacks, hot values). */
export function useEngine(): AudioEngine {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error("useEngine must be used inside <PlayerProvider>");
  return ctx;
}

interface PlayerContextValue {
  queue: Track[];
  current: Track | null;
  index: number;
  isPlaying: boolean;
  isBuffering: boolean;
  isLive: boolean;
  failoverNote: string | null;
  shuffle: boolean;
  repeat: RepeatMode;
  favorites: Track[];
  history: Track[];
  playlists: UserPlaylist[];
  toasts: ToastMessage[];
  volume: number;
  muted: boolean;
  expanded: boolean;
  queueOpen: boolean;
  setExpanded: (v: boolean) => void;
  setQueueOpen: (v: boolean) => void;
  playNow: (track: Track, context?: Track[]) => void;
  playAll: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track | Track[]) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (queueIndex: number) => void;
  clearQueue: () => void;
  jumpTo: (queueIndex: number) => void;
  next: () => void;
  previous: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (track: Track) => void;
  createPlaylist: (name: string, tracks?: Track[]) => UserPlaylist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, track: Track | Track[]) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  downloadTrack: (track: Track) => void;
  settings: PlayerSettings;
  updateSettings: (s: Partial<PlayerSettings>) => void;
  toast: (text: string, tone?: ToastMessage["tone"]) => void;
  dismissToast: (id: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const engine = useAudioEngine();

  const [settings, setSettings] = useState<PlayerSettings>(() => 
    storage.get("settings", { queueEnabled: false })
  );

  const updateSettings = useCallback((next: Partial<PlayerSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...next };
      storage.set("settings", updated);
      return updated;
    });
  }, []);

  // Queue + playhead live in sessionStorage: they survive an in-tab refresh
  // (so the player bar comes back after F5) but are wiped on a brand-new visit
  // (tab / browser closed) — a fresh launch always starts clean and hidden.
  const [queue, setQueue] = useState<Track[]>(() => session.get<Track[]>("queue", []));
  const [index, setIndex] = useState<number>(() => {
    const q = session.get<Track[]>("queue", []);
    const i = session.get<number>("index", 0);
    return q.length > 0 ? Math.min(Math.max(0, i), q.length - 1) : 0;
  });
  const [attempt, setAttempt] = useState(0);
  const [shuffle, setShuffle] = useState<boolean>(() => storage.get("shuffle", false));
  const [repeat, setRepeat] = useState<RepeatMode>(() => storage.get<RepeatMode>("repeat", "off"));
  const [favorites, setFavorites] = useState<Track[]>(() => storage.get<Track[]>("favorites", []));
  const [history, setHistory] = useState<Track[]>(() => storage.get<Track[]>("history", []));
  const [playlists, setPlaylists] = useState<UserPlaylist[]>(() => storage.get<UserPlaylist[]>("playlists", []));
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [volume, setVolumeState] = useState<number>(() => storage.get("volume", 0.85));
  const [muted, setMutedState] = useState<boolean>(() => storage.get("muted", false));
  const [expanded, setExpanded] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [failoverNote, setFailoverNote] = useState<string | null>(null);

  const queueRef = useRef(queue);
  const indexRef = useRef(index);
  /** Only true on the first mount following a refresh with a restored queue —
   *  we then load that track PAUSED instead of blasting audio unprompted. */
  const restorePauseRef = useRef<boolean>(queue.length > 0);
  const attemptRef = useRef(attempt);
  const repeatRef = useRef(repeat);
  const unshuffledRef = useRef<Track[] | null>(null);
  const consecutiveFailuresRef = useRef(0);
  const recordedRef = useRef<string>("");
  const goToRef = useRef<((i: number) => void) | null>(null);
  /** always-fresh engine snapshot for timers (the engine object is re-created each tick) */
  const engineRef = useRef(engine);
  engineRef.current = engine;

  queueRef.current = queue;
  indexRef.current = index;
  attemptRef.current = attempt;
  repeatRef.current = repeat;

  /* ------------------------------- toasts -------------------------------- */
  const toast = useCallback((text: string, tone: ToastMessage["tone"] = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const downloadTrack = useCallback(async (track: Track) => {
    const ext = track.codec?.toLowerCase().includes("mp4") || track.streamUrl.includes(".mp4") ? "m4a" : "mp3";
    const filename = `${track.artist} - ${track.title}.${ext}`.replace(/[<>:"/\\|?*]/g, "");

    try {
      toast(`Fetching audio for download...`, "info");
      
      // 1. Try a direct fetch. Works for JioSaavn, Archive which allow CORS.
      const controller = new AbortController();
      let timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let response = await fetch(track.streamUrl, { mode: "cors", signal: controller.signal }).catch(() => null);
      
      // 2. If direct fetch fails (CORS error from Audius/Jamendo), use a proxy
      if (!response || !response.ok) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => controller.abort(), 20000);
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(track.streamUrl)}`;
        response = await fetch(proxyUrl, { mode: "cors", signal: controller.signal });
      }
      clearTimeout(timeoutId);
      
      if (!response || !response.ok) throw new Error(`HTTP ${response?.status}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      
      // Delay cleanup so the browser has time to start the download
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 10000);
      
      toast(`Download complete: ${track.title}`, "success");
    } catch (error) {
      console.warn("Direct fetch failed, falling back to window.open", error);
      
      // 3. Absolute Fallback: force the browser to open it if even the proxy fails.
      const link = document.createElement("a");
      link.href = track.streamUrl;
      link.setAttribute("download", filename);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 5000);
      
      toast(`Download opened in a new tab for: ${track.title}`, "info");
    }
  }, [toast]);
  /* ---------------------------- persistence ------------------------------ */
  useEffect(() => storage.set("shuffle", shuffle), [shuffle]);
  useEffect(() => storage.set("repeat", repeat), [repeat]);
  useEffect(() => storage.set("favorites", favorites.slice(0, 400)), [favorites]);
  useEffect(() => storage.set("history", history.slice(0, HISTORY_LIMIT)), [history]);
  useEffect(() => storage.set("playlists", playlists), [playlists]);
  useEffect(() => session.set("queue", queue.slice(0, 200)), [queue]);
  useEffect(() => session.set("index", index), [index]);
  useEffect(() => {
    engine.setVolume(volume);
    storage.set("volume", volume);
  }, [volume, engine]);
  useEffect(() => {
    engine.setMuted(muted);
    storage.set("muted", muted);
  }, [muted, engine]);

  /* --------------------------- stream loading ---------------------------- */
  const current = queue[index] ?? null;
  const resolvedUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!current) {
      engine.pause();
      return;
    }
    let alive = true;
    recordedRef.current = "";
    setFailoverNote(attempt > 0 ? `Retrying via mirror #${attempt + 1}` : null);

    const doLoad = async () => {
      try {
        if (attempt === 0 || resolvedUrlsRef.current.length === 0) {
          const urls = await resolveLazyUrl(current);
          if (!alive) return;
          resolvedUrlsRef.current = urls;
        }
        const urls = resolvedUrlsRef.current;
        const url = urls[Math.min(attempt, urls.length - 1)] ?? current.streamUrl;
        if (!alive) return;
        // Refresh-restore loads PAUSED (no surprise autoplay); every play that
        // follows a real user action autoplays as usual.
        engine.load(url, { autoplay: !restorePauseRef.current, live: current.isLive });
        restorePauseRef.current = false;
        if (current.source === "radio") reportListen(current.id);
      } catch {
        if (!alive) return;
        toast(`Could not start "${current.title}" — skipping to next`, "error");
        next();
      }
    };

    void doLoad();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, attempt]);

  /* ------------------------------ watchdog -------------------------------
   * Some open mirrors accept the connection but never deliver audio. If a
   * freshly loaded stream produces no playable time within 11s we treat it as
   * dead and move on to the next mirror / track automatically.
   * --------------------------------------------------------------------- */
  useEffect(() => {
    if (!current) return;
    const timeoutMs = 12000;
    const timer = window.setTimeout(() => {
      const el = engineRef.current;
      if (el.currentTime > 0.2 || el.isPlaying || !el.isBuffering) return;
      const track = queueRef.current[indexRef.current];
      if (!track) return;
      const nextAttempt = attemptRef.current + 1;
      const maxAttempts = Math.max(2, track.fallbackUrls?.length || 0);
      if (nextAttempt < maxAttempts) {
        setFailoverNote(`Stream timed out — trying mirror #${nextAttempt + 1}`);
        setAttempt(nextAttempt);
      } else if (queueRef.current.length > 1) {
        toast(`"${track.title}" timed out — skipping`, "error");
        goToRef.current?.(indexRef.current + 1);
      }
    }, timeoutMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, attempt]);

  /* ---------------------- autoplay policy handling ----------------------- */
  useEffect(() => {
    if (!engine.blockedTick) return;
    toast("Tap the play button to start audio (browser autoplay policy)", "info");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.blockedTick]);

  /* --------------------------- history recording ------------------------- */
  useEffect(() => {
    if (!engine.isPlaying || !current) return;
    if (recordedRef.current === current.id) return;
    recordedRef.current = current.id;
    consecutiveFailuresRef.current = 0;
    const entry = { ...current, addedAt: Date.now() };
    setHistory((prev) => [entry, ...prev.filter((t) => t.id !== entry.id)].slice(0, HISTORY_LIMIT));
  }, [engine.isPlaying, current]);

  /* ------------------------------ navigation ----------------------------- */
  const goTo = useCallback(
    (nextIndex: number) => {
      const q = queueRef.current;
      if (q.length === 0) return;
      const clamped = ((nextIndex % q.length) + q.length) % q.length;
      resolvedUrlsRef.current = []; // Reset resolved URLs for new track
      setIndex(clamped);
      setAttempt(0);
    },
    [],
  );
  goToRef.current = goTo;

  const next = useCallback(() => {
    const q = queueRef.current;
    if (q.length === 0) return;
    if (q.length === 1) {
      setAttempt(0);
      engine.seek(0);
      void engine.play();
      return;
    }
    goTo(indexRef.current + 1);
  }, [engine, goTo]);

  const previous = useCallback(() => {
    if (engine.currentTime > 4) {
      engine.seek(0);
      return;
    }
    const q = queueRef.current;
    if (q.length === 0) return;
    goTo(indexRef.current - 1);
  }, [engine, goTo]);

  /* ---------------------- end / error handling --------------------------- */
  useEffect(() => {
    if (!engine.endTick) return;
    if (repeatRef.current === "one" && current) {
      engine.seek(0);
      void engine.play();
      return;
    }
    const q = queueRef.current;
    const isLast = indexRef.current >= q.length - 1;
    if (isLast && repeatRef.current === "off") {
      engine.pause();
      return;
    }
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.endTick]);

  useEffect(() => {
    if (!engine.errorTick) return;
    const track = queueRef.current[indexRef.current];
    if (!track) return;
    const nextAttempt = attemptRef.current + 1;
    const maxAttempts = Math.max(2, track.fallbackUrls?.length || 0);
    if (nextAttempt < maxAttempts) {
      setFailoverNote(`Stream failed — trying mirror #${nextAttempt + 1}`);
      setAttempt(nextAttempt);
      return;
    }

    consecutiveFailuresRef.current += 1;
    if (consecutiveFailuresRef.current >= 5) {
      toast("Multiple streams failed — playback paused. Try a different track.", "error");
      engine.pause();
      consecutiveFailuresRef.current = 0;
      return;
    }
    toast(`"${track.title}" is unreachable — skipping to next`, "error");
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.errorTick]);

  /* ------------------------------- actions ------------------------------- */
  const playAll = useCallback(
    (tracks: Track[], startIndex = 0) => {
      if (tracks.length === 0) return;
      const ordered = [...tracks];
      unshuffledRef.current = ordered;
      const list = shuffle ? [ordered[startIndex], ...shuffleArray(ordered.filter((_, i) => i !== startIndex))] : ordered;
      const target = shuffle ? 0 : startIndex;
      setQueue(list);
      queueRef.current = list;
      setIndex(target);
      indexRef.current = target;
      setAttempt(0);
    },
    [shuffle],
  );

  const playNow = useCallback(
    (track: Track, context?: Track[]) => {
      const pool = context && context.length > 1 ? context : [track];
      const at = pool.findIndex((t) => t.id === track.id);
      playAll(at >= 0 ? pool : [track, ...pool.filter((t) => t.id !== track.id)], at >= 0 ? at : 0);
    },
    [playAll],
  );

  const addToQueue = useCallback(
    (input: Track | Track[]) => {
      const items = Array.isArray(input) ? input : [input];
      if (items.length === 0) return;
      setQueue((prev) => {
        const existing = new Set(prev.map((t) => t.id));
        const addition = items.filter((t) => !existing.has(t.id));
        if (prev.length === 0) {
          queueRef.current = addition;
          return addition;
        }
        const merged = [...prev, ...addition];
        queueRef.current = merged;
        return merged;
      });
      setAttempt(0);
      toast(
        items.length === 1
          ? `Added "${items[0].title}" to the queue`
          : `Added ${items.length} tracks to the queue`,
        "success",
      );
    },
    [toast],
  );

  const playNext = useCallback((track: Track) => {
    setQueue((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id);
      const insertAt = Math.min(prev.length, indexRef.current + 1);
      const merged = [...filtered.slice(0, insertAt), track, ...filtered.slice(insertAt)];
      queueRef.current = merged;
      return merged;
    });
  }, []);

  const removeFromQueue = useCallback((queueIndex: number) => {
    setQueue((prev) => {
      if (queueIndex === indexRef.current) return prev;
      const next = prev.filter((_, i) => i !== queueIndex);
      queueRef.current = next;
      setIndex((cur) => (queueIndex < cur ? cur - 1 : Math.min(cur, Math.max(0, next.length - 1))));
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    const keep = queueRef.current[indexRef.current];
    const rest = keep ? [keep] : [];
    setQueue(rest);
    queueRef.current = rest;
    setIndex(0);
    setAttempt(0);
    toast("Queue cleared", "info");
  }, [toast]);

  const jumpTo = useCallback((queueIndex: number) => {
    setIndex(queueIndex);
    setAttempt(0);
  }, []);

  const toggle = useCallback(() => engine.toggle(), [engine]);
  const seek = useCallback((seconds: number) => engine.seek(seconds), [engine]);

  const toggleShuffle = useCallback(() => {
    setShuffle((on) => {
      const nextOn = !on;
      const q = queueRef.current;
      if (q.length > 2) {
        if (nextOn) {
          unshuffledRef.current = q;
          const head = q[indexRef.current];
          const tail = shuffleArray(q.filter((_, i) => i !== indexRef.current));
          const merged = head ? [head, ...tail] : tail;
          queueRef.current = merged;
          setQueue(merged);
          setIndex(0);
          indexRef.current = 0;
        } else if (unshuffledRef.current && unshuffledRef.current.length === q.length) {
          const restored = unshuffledRef.current;
          const currentId = q[indexRef.current]?.id;
          const at = restored.findIndex((t) => t.id === currentId);
          queueRef.current = restored;
          setQueue(restored);
          setIndex(at >= 0 ? at : 0);
          indexRef.current = at >= 0 ? at : 0;
        }
      }
      toast(nextOn ? "Shuffle on" : "Shuffle off", "info");
      return nextOn;
    });
  }, [toast]);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => {
      const nextMode: RepeatMode = r === "off" ? "one" : "off";
      toast(nextMode === "off" ? "Repeat off" : "Repeat one ∞", "info");
      return nextMode;
    });
  }, [toast]);

  const setVolume = useCallback((v: number) => setVolumeState(Math.min(1, Math.max(0, v))), []);
  const toggleMute = useCallback(() => setMutedState((m) => !m), []);

  /* ------------------------------ favourites ----------------------------- */
  const isFavorite = useCallback((id: string) => favorites.some((t) => t.id === id), [favorites]);

  const toggleFavorite = useCallback(
    (track: Track) => {
      setFavorites((prev) => {
        const exists = prev.some((t) => t.id === track.id);
        if (exists) {
          toast(`Removed "${track.title}" from favourites`, "info");
          return prev.filter((t) => t.id !== track.id);
        }
        toast(`Added "${track.title}" to favourites`, "success");
        return [{ ...track, addedAt: Date.now() }, ...prev];
      });
    },
    [toast],
  );

  /* ------------------------------- playlists ----------------------------- */
  const createPlaylist = useCallback(
    (name: string, tracks: Track[] = []) => {
      const playlist: UserPlaylist = {
        id: uid("pl"),
        name: name.trim() || "New playlist",
        createdAt: Date.now(),
        tracks,
      };
      setPlaylists((prev) => [playlist, ...prev]);
      toast(`Playlist "${playlist.name}" created`, "success");
      return playlist;
    },
    [toast],
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
      toast("Playlist deleted", "info");
    },
    [toast],
  );

  const renamePlaylist = useCallback((id: string, name: string) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)));
  }, []);

  const addToPlaylist = useCallback(
    (playlistId: string, input: Track | Track[]) => {
      const items = Array.isArray(input) ? input : [input];
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          const existing = new Set(p.tracks.map((t) => t.id));
          const addition = items.filter((t) => !existing.has(t.id));
          return { ...p, tracks: [...p.tracks, ...addition.map((t) => ({ ...t, addedAt: Date.now() }))] };
        }),
      );
      const target = playlists.find((p) => p.id === playlistId);
      toast(`Saved to ${target?.name ?? "playlist"}`, "success");
    },
    [playlists, toast],
  );

  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) } : p)),
    );
  }, []);

  const clockValue = useMemo<PlaybackClock>(
    () => ({
      currentTime: engine.currentTime,
      duration: engine.duration,
      bufferedAhead: engine.bufferedAhead,
      isLive: engine.isLive,
      isPlaying: engine.isPlaying,
      isBuffering: engine.isBuffering,
    }),
    [engine.currentTime, engine.duration, engine.bufferedAhead, engine.isLive, engine.isPlaying, engine.isBuffering],
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      current,
      index,
      isPlaying: engine.isPlaying,
      isBuffering: engine.isBuffering,
      isLive: engine.isLive,
      failoverNote,
      shuffle,
      repeat,
      favorites,
      history,
      playlists,
      toasts,
      volume,
      muted,
      expanded,
      queueOpen,
      setExpanded,
      setQueueOpen,
      playNow,
      playAll,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      jumpTo,
      next,
      previous,
      toggle,
      seek,
      toggleShuffle,
      cycleRepeat,
      setVolume,
      toggleMute,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      downloadTrack,
      settings,
      updateSettings,
      toast,
      dismissToast,
    }),
    [
      engine,
      queue,
      current,
      index,
      failoverNote,
      shuffle,
      repeat,
      favorites,
      history,
      playlists,
      toasts,
      volume,
      muted,
      expanded,
      queueOpen,
      playNow,
      playAll,
      addToQueue,
      playNext,
      removeFromQueue,
      clearQueue,
      jumpTo,
      next,
      previous,
      toggle,
      seek,
      toggleShuffle,
      cycleRepeat,
      setVolume,
      toggleMute,
      isFavorite,
      toggleFavorite,
      createPlaylist,
      deletePlaylist,
      renamePlaylist,
      addToPlaylist,
      removeFromPlaylist,
      downloadTrack,
      settings,
      updateSettings,
      toast,
      dismissToast,
    ],
  );

  return (
    <EngineContext.Provider value={engine}>
      <ClockContext.Provider value={clockValue}>
        <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
      </ClockContext.Provider>
    </EngineContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}
