# AuraBeats · Open Sound Engine

An ultra-modern, production-ready music web application that streams **live** from multiple free
public music networks. No API keys, no accounts, no subscriptions, no rate limits, no hardcoded
song lists.

[![Website](https://img.shields.io/badge/Website-aurabeats.jakariatanjim.workers.dev-7c5cff?style=for-the-badge)](https://aurabeats.jakariatanjim.workers.dev/)

🔗 **[aurabeats.jakariatanjim.workers.dev](https://aurabeats.jakariatanjim.workers.dev/)**

![stack](https://img.shields.io/badge/Vite_7-React_19-646cff)
![style](https://img.shields.io/badge/Tailwind_CSS_v4-dual_theme-38bdf8)
![cost](https://img.shields.io/badge/cost-100%25_free-22c55e)
![sources](https://img.shields.io/badge/sources-5_databases-ff6b6b)

---

## ✨ Features

### Multi-source streaming engine

Every song is a complete, full-length recording streamed from free, open
music networks with automatic multi-source racing and failover.

| Source | What it provides | Auth | Quality |
| --- | --- | --- | --- |
| **JioSaavn** | Massive database: Bollywood, regional, international. Direct MP3. | None | 320 kbps |
| **Jamendo** | Creative-Commons indie library: mood & genre filters. | None | Full |
| **Audius** | Decentralised artist catalogue: charts, releases, genre feeds. | None | 320 kbps |
| **Internet Archive** | CC & public-domain: net labels, live concerts, restored classics. | None | Full |
| **Radio Browser** | Worldwide live radio directory: tag/country filters. | None | Endless |

- Zero hardcoded tracks — every URL fetched at runtime
- Sources **race in parallel** — fastest response wins, no manual selection
- Automatic failover across mirrors if one network goes down
- **One-click MP3 downloads** for offline listening
- Two-level cache (memory + localStorage) for instant section returns

### Stream fail-over engine
```
stream error ─┐
stalled 12s  ─┼─► next mirror ─► CORS proxy ─► auto-hop to next track
```

### Smart search
- Real-time autocomplete from JioSaavn's database (actual song names, not generic hints)
- Results ranked by relevance across all 5 databases simultaneously
- 180ms debounce for near-instant feedback

### Player
- Sticky bottom player + mobile bottom navigation
- Play/pause, seek bar (properly synced), volume + mute, shuffle, repeat one
- **Mouse wheel volume control** — scroll anywhere to adjust
- **Rotating vinyl CD artwork** in the full-screen player
- Canvas audio visualizer (bars / wave / mirror modes)
- One-click download button on every track
- Favourites, playlists, listening history — all local

### Dual core theme engine
1. **Glassy** — frosted glassmorphism, neon borders, animated glowing gradients
2. **Modern** — flat, high-contrast, premium dark/light modes

Plus 8 accent colour presets or any custom colour via CSS custom properties.

---

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
npm run preview  # serve the production build
```

### Windows one-click build
Double-click **`build.bat`** — it checks your environment, installs, type-checks, and builds.

---

## 🔄 GitHub Actions Setup

To enable automated builds and releases:
1. Go to your GitHub Repository **Actions** tab.
2. Click **New workflow** -> **set up a workflow yourself**.
3. Copy the raw code from [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md) and paste it there.
4. Click **Commit changes**.

Every push to `main` will now build the project, and every version tag (e.g., `v1.0.0`) will create a GitHub Release with the ready-to-host ZIP.

---

## ☁️ Hosting

### Cloudflare Pages (recommended)

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 |

### Any static host
Upload the contents of `dist/` (just `index.html` + `_headers`) to Netlify, Vercel, GitHub Pages, nginx, S3, or any CDN. No server needed.

---

## ⌨️ Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Play / pause |
| `Shift` + `→` / `←` | Next / previous track |
| `F` | Full-screen player |
| `Mouse wheel` | Volume up / down |
| `Esc` | Close overlay |

---

## 🗂 Project structure

```
.github/workflows/
  build.yml                CI/CD pipeline
src/
  components/
    FullScreenPlayer.tsx   Expanded player with vinyl CD
    MobileNav.tsx          Mobile bottom navigation
    PlayerBar.tsx          Sticky transport bar
    Sidebar.tsx            Collapsible desktop navigation
    TopBar.tsx             Theme / mode / accent switchers
    TrackList.tsx          Rows, cards, carousel, context menus
    Visualizer.tsx         Canvas organic visualizer
    states.tsx             Error & empty states
    ui.tsx                 Artwork, sliders, modal, toaster
  hooks/
    useAudioEngine.ts      HTML5 Audio core
    useFeed.ts             Cached live-feed fetching
    usePlayer.tsx          Queue / library / persistence / downloads
    useTheme.tsx           Dual core theme + accent engine
  services/
    archive.ts             Internet Archive client
    audius.ts              Audius network client (racing mirrors)
    catalog.ts             Merges + interleaves + ranks all sources
    jamendo.ts             Jamendo CC library client
    jiosaavn.ts            JioSaavn database client (racing mirrors)
    radio.ts               Live radio directory client
  utils/                   cn, formatting, storage
  views/                   Home, Search, Radio, Library, Settings
```

---

## 🔊 Playback notes

- Only **direct HTTPS audio** endpoints are used; HLS containers are filtered out
- Archive items filtered to real songs (25s – 45min)
- Live radio streams are endless (`duration = ∞`), seeking is disabled
- Content remains the property of its creators — AuraBeats stores nothing remotely
- Downloads use direct fetch + CORS proxy fallback for maximum compatibility

---

**Built with Vite, React 19, TypeScript, Tailwind CSS v4 and Lucide.**
