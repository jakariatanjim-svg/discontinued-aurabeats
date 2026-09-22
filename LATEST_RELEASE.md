### Clean Player Bar + Deep-Linkable URLs

**1. Player Bar — Invisible Until You Actually Play**
- The player bar no longer sits at the bottom saying "Nothing playing yet" on launch. It is completely hidden and reserves **zero layout space** until the first track plays.
- Once something plays, the bar appears and stays — including while paused.
- Page refresh (F5) brings the exact queue back (paused, no surprise autoplay) because the queue now lives in **sessionStorage**.
- Closing the tab/browser wipes the session, so every fresh visit starts clean again.

**2. Layout Space Reclaimed**
- The main content area no longer keeps ~12rem of dead bottom padding when no track is loaded — pages end naturally, and padding only appears alongside the player bar (with a smooth transition).
- On mobile, spacing below content now exactly matches the bottom nav when the player is hidden.

**3. Hash-Based Deep Links (URL routing)**
- Every section now has its own URL fragment:
  - `#/` — Discover
  - `#/search` — Search
  - `#/radio` — Live Radio
  - `#/library` — Your Library
  - `#/favorites` — Favourites
  - `#/history` — Recently Played
  - `#/settings` — Settings
  - `#/about` — About AuraBeats
  - `#/playlist/<id>` — individual playlists
- Browser Back / Forward buttons work, sections can be bookmarked, and links can be shared straight to any section.
- Everything remains one single `index.html` — fragments never touch the server, so no extra files or host configuration are required.

**4. Still Includes the Previous Release**
- 4.5s feed deadlines + per-service timeouts (10s+ → ~1-2s typical).
- Lucide SVG icons everywhere — zero emojis.
- Mobile brand header ("AuraBeats — Open music player"), hero eyebrow badge, stronger hero subtitle contrast.
- `aurabeats-dist.zip` release asset for one-step Cloudflare deployment.
