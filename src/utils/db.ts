/**
 * AuraBeats IndexedDB Wrapper.
 * ----------------------------------------------------------------------------
 * Used for storing large binary blobs (MP3 files) for offline playback.
 * localStorage is too small for media, but IndexedDB can store gigabytes.
 */

import type { Track } from "@/types";

const DB_NAME = "aurabeats_media";
const STORE_NAME = "tracks";
const DB_VERSION = 1;

interface OfflineEntry {
  id: string;
  track: Track;
  blob: Blob;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export const db = {
  async saveTrack(track: Track, blob: Blob): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: OfflineEntry = { id: track.id, track, blob, savedAt: Date.now() };
      const request = store.put(entry);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  async getTrackBlob(id: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const res = request.result as OfflineEntry | undefined;
        resolve(res ? res.blob : null);
      };
    });
  },

  async getAllTracks(): Promise<Track[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as OfflineEntry[];
        // Sort by savedAt desc
        resolve(results.sort((a, b) => b.savedAt - a.savedAt).map((r) => r.track));
      };
    });
  },

  async deleteTrack(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },

  async clearAll(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  },
};
