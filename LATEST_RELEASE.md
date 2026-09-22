### Clean Slash URLs + Cloudflare-Native SEO + Tap-Anywhere

**1. Clean Slash URLs — Real Paths, Zero Hardcoding**
- Sections moved from hash fragments (`#/search`) to genuine paths: `/home`, `/search`, `/radio`, `/library`, `/favorites`, `/history`, `/settings`, `/about`, `/playlist/<id>`. Audit tools, link previews and crawlers now see each section as a first-class page.
- Browser Back/Forward, deep-link refresh and pasted links all work. Landing at bare `/` opens Discover (Home).
- Static fallback content (for JS-off crawlers) now uses the same clean `/home`, `/search`, `/radio`, `/library` links.
- `sitemap.xml` lists the real section paths for indexing.
- Everything still ships as ONE self-contained `index.html` — the History API router rehydrates each path client-side.

**2. Native Cloudflare SPA Support (2 new deploy files)**
- **`_redirects`**: declares the section paths + catch-all (`/* /index.html 200`) so visiting any section directly never 404s. It is **auto-generated at build time** from the route list in `src/config/routes.ts` (single source of truth) — add a route there and it is covered on the next build; no manual edits, no divergence.
- **`_headers`**: adds nosniff, frame and referrer hardening for the static host.
- Both live in `public/` and flow into `dist/` automatically. **Upload the whole `dist/` folder as-is (now 6 files instead of 4) — no extra steps.** The single-file `index.html` release asset still works offline by double-click (it gracefully opens Discover).

**3. Tap-Anywhere Playback (mobile usability)**
- Track rows and cards now start playback when tapped **anywhere** — artwork, gaps, duration, the whole surface. Previously only the tiny title text triggered playback (and rows needed a double-click), which was painful on phones.
- Rows and carousel/grid cards also gained keyboard play (Enter), visible focus rings, cursor pointers, and touch press feedback.
- Favourite / menu / download buttons keep their own isolated actions — tapping them never accidentally starts the track.
- Applies everywhere automatically: Home, Search results, Radio stations, Library, Favourites and History all share the same row/card components.

**4. Still Includes the Previous Release**
- Player bar hidden until first play; hidden = zero reserved layout space; session queue restore on refresh (paused); wiped on tab close.
- 4.5s feed deadlines + per-service timeouts (10s+ → ~1-2s typical).
- Lucide SVG icons everywhere — zero emojis.
- Mobile brand header, hero eyebrow badge, stronger hero subtitle contrast.
- `aurabeats-dist.zip` release asset for one-step Cloudflare deployment.
