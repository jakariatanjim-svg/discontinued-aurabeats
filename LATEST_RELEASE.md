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
