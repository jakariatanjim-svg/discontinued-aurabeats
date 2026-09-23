### Homepage Trust + Speed + Mobile UX Refresh

**1. Homepage trust explainer added**
- New **"Where the music comes from"** section added directly under the hero.
- Plain-language explanations now clarify what AuraBeats pulls from **JioSaavn, Audius, Jamendo, Internet Archive, and live radio**.
- Added a simple explanation of what **"open"** means in AuraBeats and what playback limitations users may notice per source.

**2. Hero messaging rewritten for first-time visitors**
- Homepage hero now uses a cleaner, more benefit-led CTA structure:
  - **Primary:** "Play free open tracks"
  - **Secondary:** "Browse live radio"
- Added reassurance copy explaining that AuraBeats needs **no sign-up**, plays **full tracks**, and works **instantly in the browser**.

**3. New "How AuraBeats works" section**
- Added a compact 3-step explainer covering:
  - source discovery
  - instant browser playback with mirror failover
  - favourites / playlists / history stored locally
- This makes the product easier to understand for new users before they interact with the player.

**4. Faster first load on Home**
- Homepage now loads **fewer initial tracks** in the first paint.
- Below-the-fold sections like **Fresh Releases**, **Genre browsing**, and **personalized For You** now load **when the user reaches them**, instead of preloading everything immediately.
- This reduces early payload, unnecessary artwork work, and homepage startup pressure.

**5. Mobile UI cleanup**
- Mobile top bar simplified to reduce clutter.
- Added a dedicated **mobile settings shortcut** in the top bar.
- Bottom mobile navigation is now cleaner and more focused on the 5 primary destinations.
- Home page cards, spacing, CTA layout, and explainer blocks were rebalanced for better one-hand browsing.

---

### Massive Offline Update: In-App Downloads & Stability

**1. In-App Downloads (True Offline Playback)**
- New **"Save for offline"** button (cloud icon) added directly to song rows for instant access.
- Also available via the "..." menu as "Save for offline".
- This saves the full track data into a private, high-capacity browser database (IndexedDB).
- Saved tracks can be played even with **zero internet connection** — the app will automatically detect and load from local storage first.
- A new **"Downloads"** section added to the sidebar/navigation to manage your offline music.
- **Offline Badge:** Saved songs now show a blue "offline" badge on their cards so you know what's ready to play without net.
- Existing "Download MP3" (Export) remains available for those who want to keep files on their device outside the app.

**2. Improved Offline Site Stability**
- Service Worker upgraded to aggressively cache the app shell and all routes.
- You can now open and navigate the app (Home, Search, Downloads, etc.) without an internet connection once it has been cached.

**3. Granular Data Management**
- Settings page now features three separate clear-data options for better control:
  - **Clear App Cache:** Refreshes the Service Worker and cached assets.
  - **Clear Offline Media:** Deletes all saved music but keeps your playlists/history.
  - **Clear App Data:** Resets playlists, favourites, and history.

**4. Personalization + Privacy Policy + Audit Fixes**

**5. "For You" — Personalized Recommendations**
- AuraBeats now learns from your listening history and favourites to derive your top genres.
- A new "For You" carousel appears on the Home page once you have enough listening data — powered entirely by local analysis, no server, no tracking.
- Shows "Based on your love for electronic, lo-fi, jazz" (whatever your top genres are).

**2. Privacy Policy Page**
- New `/privacy` route with a comprehensive, honest privacy policy.
- Covers: what we store (localStorage only), what we don't collect (nothing), third-party API connections, security headers, and how to delete all data.
- Linked from the About page.

**3. Audit Report Fixes**
- **Trust signals in hero:** Added a trust bar explaining exactly what "open music" means — Creative Commons, artist-approved uploads, public domain archives, zero data collection.
- **Information hierarchy:** Hero section is now tighter with clear CTA + trust bar, separating marketing copy from app content.
- **Consistent branding:** Wire-type AudioWaveform icon replaced everywhere (Sidebar, TopBar, About page) with the solid waveform bars logo matching the tab favicon — one cohesive brand.

**4. DNS Optimization**
- Primary APIs (JioSaavn, Jamendo, Archive, Audius) use `preconnect` for full DNS+TCP+TLS warmup.
- All fallback mirrors (Piped, Audius 2/3, JioSaavn Vercel mirrors) use `dns-prefetch`.
- Faster first API response on cold loads.

**5. Previous Updates Included**
- Search UI overhaul with autocomplete, infinite scroll, compact PC layout.
- PWA installable on PC and mobile.
- GPU acceleration, full screen player fixes, clean slash URLs.
