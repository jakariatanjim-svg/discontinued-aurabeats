import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { storage } from "@/utils/storage";

/** Tiny in-memory pub/sub so the same feed is fetched once across components. */
type Listener = () => void;

interface CacheEntry<T> {
  value: T;
  at: number;
}

const memory = new Map<string, CacheEntry<unknown>>();
const listeners = new Map<string, Set<Listener>>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string, l: Listener): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(l);
  return () => listeners.get(key)!.delete(l);
}

function readCache<T>(key: string, ttl: number): CacheEntry<T> | null {
  const mem = memory.get(key) as CacheEntry<T> | undefined;
  if (mem) return mem;
  const disk = storage.get<{ value: T; at: number } | null>(`feed:${key}`, null);
  if (!disk || typeof disk.at !== "number") return null;
  if (Date.now() - disk.at > ttl) return null;
  memory.set(key, disk as CacheEntry<unknown>);
  return disk as CacheEntry<T>;
}

function writeCache<T>(key: string, value: T) {
  const entry = { value, at: Date.now() };
  memory.set(key, entry as CacheEntry<unknown>);
  storage.set(`feed:${key}`, entry);
}

export function invalidateFeeds(prefix?: string) {
  const keys = [...memory.keys()].filter((k) => (prefix ? k.startsWith(prefix) : true));
  keys.forEach((k) => {
    memory.delete(k);
    storage.remove(`feed:${k}`);
    emit(k);
  });
}

export interface FeedState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  refresh: () => void;
}

/**
 * Fetches a live feed from the open network with a two-level cache
 * (memory + localStorage) so returning to a section is instant and offline
 * friendly, while data still refreshes from the source when stale.
 */
export function useFeed<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: { enabled?: boolean; ttl?: number } = {},
): FeedState<T> {
  const { enabled = true, ttl = 10 * 60 * 1000 } = options;
  const [nonce, setNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const snapshot = useSyncExternalStore(
    useCallback((cb: Listener) => subscribe(key, cb), [key]),
    () => memory.get(key) as CacheEntry<T> | undefined,
    () => undefined,
  );

  const cached = snapshot ?? readCache<T>(key, ttl);
  const [stale, setStale] = useState(!cached);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const ctrl = new AbortController();
    const entry = readCache<T>(key, ttl);
    if (entry) {
      setLoading(false);
      setError(null);
      if (Date.now() - entry.at < ttl) {
        setStale(false);
        return () => ctrl.abort();
      }
    }
    setStale(Boolean(entry));
    setLoading(true);
    fetcherRef
      .current(ctrl.signal)
      .then((data) => {
        if (!alive) return;
        writeCache(key, data);
        setError(null);
        setStale(false);
      })
      .catch((err: unknown) => {
        if (!alive || ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not reach the open network");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, ttl, nonce]);

  const refresh = useCallback(() => {
    memory.delete(key);
    storage.remove(`feed:${key}`);
    setLoading(true);
    setNonce((n) => n + 1);
  }, [key]);

  const value = snapshot ? snapshot.value : (cached?.value ?? null);

  return { data: value ?? null, loading: loading && !value, error, stale, refresh };
}

export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
