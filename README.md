# AuraBeats · Streaming Engine

An ultra-modern, production-ready music streaming application that aggregates the world's largest audio catalogs into one seamless web experience. No API keys, no accounts, no subscriptions, no rate limits.

[![Website](https://img.shields.io/badge/Website-aurabeats.pages.dev-7c5cff?style=for-the-badge)](https://aurabeats.pages.dev/)

🔗 **[aurabeats.pages.dev](https://aurabeats.pages.dev/)**

![stack](https://img.shields.io/badge/Vite_7-React_19-646cff)
![style](https://img.shields.io/badge/Tailwind_CSS_v4-dual_theme-38bdf8)
![cost](https://img.shields.io/badge/cost-100%25_free-22c55e)
![sources](https://img.shields.io/badge/sources-7_engines-ff6b6b)

---

## ✨ Features

### Hybrid Playback Engine
- **Dual Core**: Seamlessly switches between a native HTML5 Audio engine (for direct MP3 sources) and a hidden, ad-free YouTube IFrame player.
- **Unified Controls**: Play, pause, seek, and volume work identically across all sources.
- **Smart Failover**: Automatically races multiple mirrors and fallback sources if a stream fails.

### Multi-source Aggregation
Every song is a complete, full-length recording streamed from multiple public networks.

| Source | What it provides | Quality |
| --- | --- | --- |
| **YouTube Music** | World's largest catalog: Official, remixes, slowed, live. | High |
| **JioSaavn** | Massive mainstream database: Bollywood, regional, international. | 320 kbps |
| **SoundCloud** | Indie, underground, remixes, and user-uploaded hits. | Variable |
| **Audius** | Decentralised artist catalogue: charts, releases, genre feeds. | 320 kbps |
| **Jamendo** | Creative-Commons indie library: mood & genre filters. | Full |
| **Internet Archive** | Historical recordings, net labels, live concerts, classics. | Full |
| **Radio Browser** | Worldwide live radio directory: tag/country filters. | Endless |

### Smart Search & Discovery
- **Two-Tab Search**: Dedicated filters for **YT Music** ( lyrics-friendly, fuzzy matching) and **Other Sources** (consolidated database results).
- **Favourites-First Personalization**: The "For You" section learns from your **Favourites only**, ensuring your daily mix isn't polluted by random test listens or play history.
- **Engine Status**: Real-time connectivity monitoring in Settings with a manual "Test Connectivity" suite.

### Player Experience
- **Sticky Bottom Player** + polished mobile navigation.
- **Rotating Vinyl CD Artwork** in the full-screen player.
- **Swipe-to-Minimize**: Easily minimize the full-screen player on mobile with a simple downward swipe.
- **Canvas Audio Visualizer**: (Note: analyzed only for native audio sources).
- **In-App Downloads**: Save tracks for offline use ( native sources) or use the one-click prefilled downloader modal (YouTube).

### Dual Core Theme Engine
1. **Glassy** — frosted glassmorphism, neon borders, animated glowing gradients.
2. **Modern** — flat, high-contrast, premium dark/light modes.
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

Every push to `main` will now build the project and create a unique, timestamped GitHub Release (e.g., `2026.09.25-42`) with the ready-to-host ZIP.

---

## 📱 Install as App (PWA)

AuraBeats is a fully installable Progressive Web App — works like a native app on all platforms.

### Android / PC (Chrome / Edge)
1. Open [aurabeats.pages.dev](https://aurabeats.pages.dev/).
2. Tap the **three-dot menu (⋮)** or the **install icon (⊕)** in the address bar.
3. Tap **"Install app"** or **"Add to Home screen"**.

### iOS (Safari)
1. Open [aurabeats.pages.dev](https://aurabeats.pages.dev/) in **Safari**.
2. Tap the **Share button** and scroll down to **"Add to Home Screen"**.

### 🔄 Auto-Updates
The app checks for updates silently in the background every time it is opened. When a new version is found, it will automatically refresh the app shell to ensure you are always on the latest version.

---

## ☁️ Hosting

### Cloudflare Pages (recommended)
| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 |

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

## 🔊 Playback notes
- Content remains the property of its respective creators — AuraBeats stores nothing remotely.
- YouTube playback is routed through an invisible IFrame player for seamless integration.
- Downloads use direct fetch or a prefilled external converter for maximum mobile compatibility.
- Built for performance, speed, and privacy.

---

**Built with Vite, React 19, TypeScript, Tailwind CSS v4 and Lucide.**
