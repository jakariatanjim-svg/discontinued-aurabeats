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

No builds, no installs — AuraBeats is already live:

1. **Website** — open [aurabeats.pages.dev](https://aurabeats.pages.dev) in any browser, on PC or mobile.
2. **PWA** — install it from the browser menu for a native-app feel (see below).
3. **Android APK** — grab `AuraBeats.apk` from the [latest GitHub Release](https://github.com/jakariatanjim-svg/aurabeats/releases/latest); afterwards the app updates itself from Settings.

New versions are built, packaged and published automatically by GitHub Actions on every push to `main` — there is nothing to compile by hand.

---

## 📦 Distribution

- **Website / PWA** — the primary target. Host `dist/` anywhere static (Cloudflare Pages recommended) and install it as a PWA on Android, iOS, or any desktop browser.
- **Android APK** — built by the APK workflows and attached to GitHub Releases; the in-app **Check App Update** button picks new versions up.
- **No desktop installer** — the project is web-first by design. On PC, use the website directly or install the PWA from Chrome/Edge.

---

## 🔄 GitHub Actions

Builds and releases are automated; the workflows live in `.github/workflows/`:

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `build.yml` — Auto: Web Build & Release | push to `main` | type-check, build, create a timestamped GitHub Release (e.g. `2026.09.25-42`) with the ready-to-host ZIP |
| `build-apk.yml` — Auto: Android APK | push to `main` | build a debug APK and upload it into the latest release |
| `manual-web.yml` — Manual: Web Build | `workflow_dispatch` | rebuild the web bundle and overwrite the files in the latest release |
| `manual-apk.yml` — Manual: Android APK | `workflow_dispatch` | rebuild the APK and overwrite it in the latest release |
| `branch-web.yml` — Manual: Branch Web Build | `workflow_dispatch` (one button, nothing to pick) | builds the newest non-main branch and saves a run artifact; never touches releases |
| `branch-apk.yml` — Manual: Branch APK Build | `workflow_dispatch` (one button, nothing to pick) | builds the newest non-main branch and saves a run artifact; never touches releases |

Branch builds exist for testing work-in-progress code without any automatic trigger: press the button and the run itself picks the newest branch other than `main` (the one the current Arena session works on), then download the ZIP/APK from the run's **Artifacts** section. Releases are only ever created or updated by the `main` pipelines or a manual dispatch.

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

## 🧑‍💻 About

AuraBeats is a solo project: designed, built and operated by one person, with GitHub Actions doing the release engineering. No servers, no API keys, no accounts, no bills — just a static bundle, a hidden YouTube player and a lot of glue.

**Built with Vite, React 19, TypeScript, Tailwind CSS v4 and Lucide.**
