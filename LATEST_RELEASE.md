### Search Overhaul + PWA + Performance Polish

**1. Search UI Redesign**
- Browse All cards are now compact horizontal tiles instead of oversized boxes — fits desktop and mobile naturally.
- Artist grid adjusted from 6 columns to 5 with tighter spacing; cards are cleaner with fixed avatar sizes.
- Result list panel padding tightened for a denser, more professional look.

**2. Real-Time Search Suggestions (Autocomplete)**
- As you type, a dropdown of real song/artist matches appears below the search box (powered by JioSaavn's database).
- Click any suggestion to instantly search that exact song or artist name.
- Works for specific songs — "Jennifer Lopez On The Floor" will now surface the actual track via autocomplete, not just broad keyword results.

**3. Infinite Scroll + End Marker**
- Results load progressively as you scroll (20 at a time).
- When all results are loaded, a clean "End of results · X tracks loaded" message appears — no hard lock, no confusion.

**4. Queue — Beta Label**
- The experimental queue feature in Settings now has a clear "Beta" badge and a friendlier description explaining it is under active development — no more user confusion about why it might behave unexpectedly.

**5. PWA — Installable on PC and Mobile**
- AuraBeats is now a Progressive Web App. On supported browsers:
  - **Chrome/Edge (PC):** Click the install icon in the address bar to install as a desktop app.
  - **Android (Chrome):** "Add to Home Screen" prompt or the install banner.
  - **iOS (Safari):** Share → Add to Home Screen.
- Once installed, AuraBeats opens in its own window with a custom icon, no browser chrome, and offline app shell caching via Service Worker.

**6. SEO & Audit Fixes**
- Meta description expanded to 156 characters (was 108, target 120-160).
- Raw HTML content significantly expanded: feature list, source details, and footer added to the static `index.html` so crawlers see rich content without JavaScript.
- All URLs updated to `aurabeats.pages.dev`.

**7. GPU Acceleration**
- `blur-panel` elements now use `transform: translateZ(0)`, `backface-visibility: hidden`, and `contain: layout style paint` for hardware-accelerated compositing.
- Scroll areas force GPU layers with `translate3d(0,0,0)`.
- Sidebar hover animations simplified to color-only transitions (no scale transforms) to eliminate flicker on glass panels.
