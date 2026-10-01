### YouTube True Audio Engine (Zero Cross-Matching)

**1. Actual YouTube Audio Playback (No Cheating)**
- AuraBeats no longer cross-matches YouTube searches with JioSaavn audio. 
- When you search for a song on the **YT Music** tab and press play, you are now hearing the **exact audio from that specific YouTube video**.
- If you search for a specific "Slowed + Reverb" mix, a live performance, or a 1-hour lofi compilation, you will hear exactly that version.

**2. Invisible IFrame Player Implementation**
- Because all public frontend-only stream extractors (Piped, Cobalt, Invidious companions) are currently dead or auth-locked in 2026, AuraBeats now uses a completely different approach.
- An **invisible, muted-by-default official YouTube IFrame player** is embedded securely in the app shell.
- When you play a `yt-resolve:` track, the native HTML5 `<audio>` engine pauses, and the custom AudioEngine seamlessly routes playback control (play, pause, seek, volume) directly to the hidden YouTube player.
- You get the beautiful, ad-free AuraBeats UI, but the audio comes straight from Google's servers legally.

**3. Unified AudioEngine Controls**
- The global `useAudioEngine` hook has been overhauled to support dual playback targets.
- Playback queue, visualizer state, and media transport controls automatically sync between the local `<audio>` element (for JioSaavn, Audius, Jamendo) and the hidden YouTube player.
- Note: The `<Visualizer />` bar animations will pause during YouTube playback because the Web Audio API cannot analyze cross-origin IFrame audio, but all other controls remain fully functional.

**4. Performance**
- The YouTube IFrame API script is lazy-loaded only when needed.
- No heavy backend extraction APIs are called. No proxy race delays. YouTube playback starts almost instantly.
