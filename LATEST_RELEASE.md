### Performance + UX + Search Overhaul

**1. Critical Performance Fix (10s → Instant)**
- Added critical above-the-fold CSS inline in `index.html` so background and app shell paint immediately before any JavaScript runs.
- Replaced the heavy GPU-intensive aurora animation (filter: blur 120px + continuous animation) with a lightweight static radial gradient — zero GPU overhead.
- Removed `background-attachment: fixed` which caused expensive paint recalculation on scroll.
- Added a branded animated splash screen that shows while JS loads, so users see AuraBeats immediately instead of a blank white page.
- Reduced `backdrop-filter` blur across all panels from 48px → 16px for smoother rendering.
- Added `contain: layout style` to glass panels to reduce browser repaint scope.

**2. Default Route Fix**
- App now always opens to Discover (Home) on fresh load or when previous session was on Search/Settings.

**3. Default Theme: Ocean**
- Changed default accent color from Nebula (purple) to Ocean (blue) for a fresher first impression.

**4. Search Browse All — Visual Upgrade**
- "Browse All" discovery cards now have real emoji icons, genre-matched color gradients, and a bottom glow overlay — no more plain text on a flat background.

**5. Previous Audit Patches Included**
- SEO: canonical, Open Graph, JSON-LD, robots.txt, sitemap.xml.
- About page created with all source/rights info.
- Home hero cleaned — no documentation clutter.
