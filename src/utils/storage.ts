/** Namespaced, crash-proof localStorage wrapper (private mode / quota safe). */

const NS = "aurabeats:v1:";

function available(): boolean {
  try {
    const k = `${NS}__probe`;
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const ok = typeof window !== "undefined" ? available() : false;

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!ok) return fallback;
    try {
      const raw = window.localStorage.getItem(NS + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (!ok) return;
    try {
      window.localStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* quota exceeded — ignore silently */
    }
  },
  remove(key: string): void {
    if (!ok) return;
    try {
      window.localStorage.removeItem(NS + key);
    } catch {
      /* ignore */
    }
  },
  clearAll(): void {
    if (!ok) return;
    try {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(NS))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  },
  keys(): string[] {
    if (!ok) return [];
    try {
      return Object.keys(window.localStorage).filter((k) => k.startsWith(NS));
    } catch {
      return [];
    }
  },
  bytes(): number {
    if (!ok) return 0;
    try {
      return Object.keys(window.localStorage)
        .filter((k) => k.startsWith(NS))
        .reduce((acc, k) => acc + (window.localStorage.getItem(k)?.length ?? 0), 0);
    } catch {
      return 0;
    }
  },
};

export function debounce<A extends unknown[]>(fn: (...args: A) => void, wait = 250) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Session-scoped storage — survives an in-tab page refresh but is wiped when
 * the tab / browser closes. Used for the "now playing" queue so the player bar
 * reappears after a refresh yet the app opens clean on a brand-new visit.
 */
function sessionAvailable(): boolean {
  try {
    const k = `${NS}__sprobe`;
    window.sessionStorage.setItem(k, "1");
    window.sessionStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

const sOk = typeof window !== "undefined" ? sessionAvailable() : false;

export const session = {
  get<T>(key: string, fallback: T): T {
    if (!sOk) return fallback;
    try {
      const raw = window.sessionStorage.getItem(NS + key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (!sOk) return;
    try {
      window.sessionStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* quota exceeded — ignore silently */
    }
  },
  remove(key: string): void {
    if (!sOk) return;
    try {
      window.sessionStorage.removeItem(NS + key);
    } catch {
      /* ignore */
    }
  },
};
