# What's New

## Multi-Source Streaming Engine
- **6 music sources** running in parallel: JioSaavn, Jamendo, Audius, HearThis.at, Internet Archive, Radio Browser
- All sources race each other — fastest response wins, zero manual selection
- Automatic failover: if one source dies mid-stream, the next mirror picks up instantly

## One-Click MP3 Downloads
- Download any track directly to your device as an MP3 file
- Works from the player bar, full-screen player, and track context menus
- CORS proxy fallback ensures downloads work across all sources

## Smart Search
- Real-time autocomplete suggestions powered by JioSaavn's database
- Results ranked by relevance across all 5 music databases simultaneously
- 180ms debounce for near-instant feedback

## Polished Player
- Vinyl CD artwork that rotates smoothly during playback in the full-screen player
- Seek bar properly synced — no more fighting between drag and playback timer
- Mouse wheel volume control anywhere on the page
- Repeat toggle with clear on/off icons (Repeat OFF vs Repeat ONE)

## Queue System (Optional)
- Queue is OFF by default for a cleaner interface
- Power users can enable it in Settings > Experimental > Playback Queue
- Full queue management: reorder, remove, clear, play next

## Dual Theme Engine
- **Glassy**: frosted glassmorphism with neon glows and translucent panels
- **Modern**: flat, high-contrast premium dark/light modes
- 8 accent colour presets + custom colour picker

## Performance
- DNS prefetch and preconnect for all music source domains
- Parallel API racing across mirror pools (Audius, JioSaavn)
- Two-level cache (memory + localStorage) for instant section returns
- Single-file production bundle (~125 KB gzipped)

---

**Website:** https://aurabeats.jakariatanjim.workers.dev/

Download the ZIP below, extract, and host on any static server. No backend required.
