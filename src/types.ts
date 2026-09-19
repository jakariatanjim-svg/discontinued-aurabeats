/**
 * AuraBeats shared type definitions.
 * Every track/artist/playlist object in the app is produced by the live
 * network services (audius.ts / radio.ts) — nothing is authored statically.
 */

export type TrackSource = "archive" | "audius" | "radio" | "jiosaavn" | "jamendo" | "hearthis" | "youtube";

export interface PlayerSettings {
  queueEnabled: boolean;
}

export interface Track {
  /** Stable unique id (prefixed by source to avoid collisions) */
  id: string;
  title: string;
  artist: string;
  artistHandle?: string;
  artistAvatar?: string;
  album?: string;
  artwork: string;
  artworkLarge: string;
  /** secondary artwork endpoint tried automatically if the primary fails */
  artworkFallback?: string;
  /** Seconds. 0 means an endless live stream. */
  duration: number;
  genre?: string;
  mood?: string;
  source: TrackSource;
  /** Primary playable URL */
  streamUrl: string;
  /** Alternative open endpoints used by the automatic fail-over engine */
  fallbackUrls: string[];
  homepage?: string;
  country?: string;
  tags?: string[];
  bitrate?: number;
  codec?: string;
  playCount?: number;
  favoriteCount?: number;
  releaseDate?: string;
  isLive: boolean;
  addedAt?: number;
}

export interface Artist {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  followers: number;
  verified: boolean;
  trackCount: number;
}

export type RepeatMode = "off" | "all" | "one";

export interface UserPlaylist {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
}

export type ThemeName = "glassy" | "modern";
export type ThemeMode = "dark" | "light";

export interface ViewDescriptor {
  key: string;
  label: string;
}

export type FeedKind = "trending" | "underground" | "genre" | "mood" | "search" | "artist" | "radio";

export interface Feed {
  id: string;
  title: string;
  subtitle?: string;
  kind: FeedKind;
  /** genre / mood / query / handle payload */
  value?: string;
}

export interface ToastMessage {
  id: number;
  text: string;
  tone: "info" | "success" | "error";
}
