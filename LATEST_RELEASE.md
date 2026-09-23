### Cloudflare Pages & Clean URL Overhaul

**1. Professional URL Structure (Cloudflare Pages Migration)**
- AuraBeats has officially moved to **aurabeats.pages.dev**.
- Replaced hash-based routing (`#/search`) with clean slash URLs (`/search`, `/radio`, `/settings`).
- Added native SPA support via `_redirects` and `_headers` for seamless Cloudflare Pages deployment.
- Updated all canonical links, Open Graph tags, and the XML sitemap to reflect the new domain.

**2. Feed Performance (10s+ → ~2s typical)**
- Every music source now races against a **4.5-second hard deadline**.
- Slow or unresponsive mirrors are automatically dropped, ensuring the UI paints music almost instantly.
- Added timeouts and proper connection cancellation to JioSaavn, Jamendo, and YouTube (Piped) mirror racing.

**3. Visual & UX Fixes**
- **Invisible Text Fix:** The hero subtitle ("Five live sources...") now uses a solid high-contrast variable that works perfectly in both Dark and Light modes.
- **Full Screen Player:** Fixed a visual seam/line in the backdrop glow. The background is now a smooth, deeply blurred atmosphere that prevents back-page text from peeking through.
- **Tap-Anywhere Playback:** You can now tap anywhere on a song row or card (artwork, title, or empty space) to start playing — a major win for mobile usability.
- **Professional Icons:** Removed all emojis from the discovery cards, replacing them with crisp, device-independent Lucide SVG icons.

**4. Storage & Session Management**
- The "Now Playing" queue now lives in **sessionStorage**. It survives a page refresh (F5) but is automatically cleared when you close the tab/browser, keeping your fresh starts clean.
- The Player Bar is completely hidden until you actually play your first song, reclaiming valuable screen space.

**5. Release Packaging**
- New `aurabeats-dist.zip` asset added to releases for one-step drag-and-drop deployment to Cloudflare Pages.
