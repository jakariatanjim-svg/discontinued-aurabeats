# AuraBeats · Open Sound Engine

An ultra-modern, production-ready music web application that streams **live** from open, key-free
public music networks. No API keys, no accounts, no subscriptions, no rate limits, no hardcoded
song lists.

### 🔗 **Live Demo: [aurabeats.jakariatanjim.workers.dev](https://aurabeats.jakariatanjim.workers.dev/)**

[![Live Hosted](https://img.shields.io/badge/Live-Hosted-7c5cff?style=for-the-badge)](https://aurabeats.jakariatanjim.workers.dev/)

![stack](https://img.shields.io/badge/Vite-React_19-646cff) ![style](https://img.shields.io/badge/Tailwind_CSS_v4-dual_theme-38bdf8) ![cost](https://img.shields.io/badge/cost-100%25_free-22c55e)

---

## ✨ Features

### Multi-source streaming engine
**No official / commercial music APIs. No API keys. No accounts. No 30-second previews.**
Every song AuraBeats plays is a complete, full-length recording streamed from free, open
public music networks with automatic multi-source fallback.

| Source | What it provides | Auth | Length |
| --- | --- | --- | --- |
| **JioSaavn** | Massive music database: Bollywood, regional, international, high-quality streams. Direct MP3 via unofficial API. | None | Full tracks |
| **Jamendo** | Creative-Commons independent music library: indie artists, CC-licensed, mood & genre filters. | None | Full tracks |
| **Audius** | Open, decentralised, artist-owned catalogue: popularity charts, fresh releases, genre feeds. | None | Full tracks |
| **HearThis.at** | Independent artist platform: trending, electronic, hip-hop, experimental uploads. | None | Full tracks |
| **Internet Archive** | CC & public-domain music: net labels, live concerts, restored classics. | None | Full tracks |
| **Radio Browser** | Community directory of worldwide live radio, tag/country filters. | None | Endless live |

* Zero hardcoded tracks — every title, artist, artwork and stream URL is fetched at runtime.
* Feeds *merge and interleave* the archives, so if one network is down the page still fills.
* Every provider is pooled across multiple public mirrors; requests rotate automatically.
* **Direct Downloads:** Export any track locally as an MP3 with one click for offline listening.
* Two-level cache (memory + `localStorage`) makes returning to a section instant and keeps the app
  usable when the network flakes out.

### Stream fail-over engine
```
stream error ─┐
stalled 11s  ─┼─► next storage node ─► next mirror ─► auto-hop to next track
```
* Every track carries **3-4 equivalent stream endpoints** (canonical redirect + each physical
  storage node) so a single dead server is invisible to the listener.
* A **stall watchdog** catches mirrors that accept the connection but never deliver audio.
* The media element is intentionally **never** given `crossOrigin` and **never** routed through a
  Web Audio `MediaElementSource`. Either would force a CORS pre-flight on every redirect hop of a
  public archive URL and silently kill playback (the classic "0:00 / 0:00, nothing plays" bug).
  The visualizer therefore runs on its organic simulation — identical to the eye, impossible to
  break audio.

### Dual core theme engine
1. **Glassy** — frosted glassmorphism: `backdrop-filter` panels, translucent floating surfaces,
   neon borders, animated glowing gradients.
2. **Modern** — flat, high-contrast, premium dark/light modes.

Plus a **live accent system**: eight curated presets or any custom colour, re-tinting every
control, slider, glow and visualizer instantly through CSS custom properties.

### Player
* Sticky bottom player (persistent on every route) + bottom navigation on mobile.
* Play / pause, interactive seek bar with live buffering track, volume + mute, shuffle,
  repeat off / all / one, next, previous.
* Rotating & glowing album art plus a canvas **audio visualizer** (bars / wave / mirror modes).
* Full-screen expanded player with up-next queue.
* Queue management, instant favourites, custom playlists and automatic listening history —
  all persisted locally.

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build
```

### Windows one-click build
Double-click **`build.bat`** (or run it from a terminal):

```bat
call npm install
call npx tsc --noEmit
call npm run build
```

---

## ☁️ Cloudflare Pages

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 (or 18+) |

`public/_headers` is emitted into `dist` with hardening headers and a CSP that whitelists the
open audio/image hosts. The app is a single static bundle — no server, no functions, no cost.

---

## ⌨️ Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `Shift` + `→` / `←` | Next / previous track |
| `F` | Full-screen player |
| `Q` | Toggle queue panel |
| `Esc` | Close overlay |

---

## 🗂 Project structure

```
src/
├── components/
│   ├── FullScreenPlayer.tsx   Expanded player + queue drawer
│   ├── MobileNav.tsx          Mobile bottom navigation
│   ├── PlayerBar.tsx          Sticky transport bar
│   ├── Sidebar.tsx            Collapsible desktop navigation
│   ├── TopBar.tsx             Theme core / mode / accent switchers
│   ├── TrackList.tsx          Rows, cards, carousel, hero, menus
│   ├── Visualizer.tsx         Canvas FFT / organic visualizer
│   ├── states.tsx             Error & empty states
│   └── ui.tsx                 Artwork, sliders, modal, toaster, chips…
├── hooks/
│   ├── useAudioEngine.ts      HTML5 Audio + Web Audio analyser core
│   ├── useFeed.ts             Cached live-feed fetching
│   ├── usePlayer.tsx          Global queue / library / persistence store
│   └── useTheme.tsx           Dual core theme + accent engine
├── services/
│   ├── archive.ts             Internet Archive full-length music client
│   ├── audius.ts              Open artist-network client
│   ├── catalog.ts             Merges + interleaves all free sources
│   └── radio.ts               Open live-radio directory client
├── utils/                     cn, formatting, storage
└── views/                     Home, Search, Radio, Library, Settings
```

---

## 🔊 Playback notes

* Only **direct HTTPS audio** endpoints are used; HLS/playlist containers are filtered out because
  browsers cannot decode them natively.
* Archive items are filtered to real songs (25 s – 45 min) so multi-hour show recordings and
  jingles never pollute a feed.
* Live radio streams are endless (`duration = ∞`): seeking is disabled and a `LIVE` badge is shown.
* Content is streamed from public endpoints and remains the property of its creators. AuraBeats
  stores nothing remotely and proxies nothing.

Built with Vite, React, TypeScript, Tailwind CSS and Lucide.
