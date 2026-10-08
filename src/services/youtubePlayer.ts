// Singleton YouTube IFrame Player instance
let ytPlayer: any = null;
let ytReady = false;
let ytReadyPromise: Promise<void> | null = null;
let currentVideoId: string | null = null;
let pendingVideoId: string | null = null;

export function initYouTubePlayer() {
  if (ytReadyPromise) return ytReadyPromise;

  ytReadyPromise = new Promise((resolve) => {
    // If YT API already loaded (e.g. page refresh with cached SW)
    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer(resolve);
      return;
    }

    // Load YouTube IFrame API script
    const existing = document.getElementById("yt-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Create an off-screen container for the player.
    // IMPORTANT: YouTube embeds are unreliable at 1x1. Some videos throw
    // HTML5 playback errors unless the iframe has a reasonable viewport.
    // So we keep it fully off-screen + visually hidden, but NOT microscopic.
    if (!document.getElementById("yt-hidden-player-container")) {
      const container = document.createElement("div");
      container.id = "yt-hidden-player-container";
      container.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:320px;height:180px;opacity:0;pointer-events:none;overflow:hidden;";
      document.body.appendChild(container);

      const playerDiv = document.createElement("div");
      playerDiv.id = "yt-hidden-player";
      playerDiv.style.width = "320px";
      playerDiv.style.height = "180px";
      container.appendChild(playerDiv);
    }

    (window as any).onYouTubeIframeAPIReady = () => createPlayer(resolve);
  });

  return ytReadyPromise;
}

function createPlayer(resolve: () => void) {
  ytPlayer = new (window as any).YT.Player("yt-hidden-player", {
    height: "180",
    width: "320",
    videoId: "", 
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      iv_load_policy: 3,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: () => {
        ytReady = true;
        // Critical: Patch iframe for Error 150 fix
        patchIframe();
        // Play any video that was queued before player finished loading
        if (pendingVideoId) {
          loadAndPlay(pendingVideoId);
          pendingVideoId = null;
        }
        resolve();
      },
      onStateChange: (event: any) => {
        window.dispatchEvent(new CustomEvent("yt-state-change", { detail: event.data }));
      },
      onError: (event: any) => {
        console.warn("[YT Player] Error code:", event.data);
        currentVideoId = null; // reset so retry works
        window.dispatchEvent(new CustomEvent("yt-error", { detail: event.data }));
      },
    },
  });
}

function loadAndPlay(videoId: string) {
  if (!ytPlayer || !ytReady) return;
  try {
    ytPlayer.loadVideoById({ videoId, startSeconds: 0 });
    currentVideoId = videoId;
  } catch (err) {
    console.warn("[YT Player] loadVideoById failed:", err);
  }
}

/**
 * After player is ready, set referrerPolicy on the iframe.
 * IMPORTANT: Do NOT change iframe.src — that causes infinite reload loops.
 */
function patchIframe() {
  try {
    const iframe = ytPlayer?.getIframe?.() as HTMLIFrameElement | null;
    if (!iframe) return;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
  } catch {
    /* ignore */
  }
}

export function playYouTubeVideo(videoId: string) {
  if (!ytReady || !ytPlayer) {
    pendingVideoId = videoId;
    return;
  }

  // Patch referrerPolicy (safe, no src change)
  patchIframe();

  if (currentVideoId === videoId) {
    try {
      const state = ytPlayer.getPlayerState?.();
      if (state === 0 || state === -1 || state === 5) {
        loadAndPlay(videoId);
      } else {
        ytPlayer.playVideo();
      }
    } catch {
      loadAndPlay(videoId);
    }
  } else {
    loadAndPlay(videoId);
  }
}

export function pauseYouTubeVideo() {
  if (ytReady && ytPlayer) {
    try { ytPlayer.pauseVideo(); } catch { /* ignore */ }
  }
}

export function seekYouTubeVideo(seconds: number) {
  if (ytReady && ytPlayer) {
    try { ytPlayer.seekTo(seconds, true); } catch { /* ignore */ }
  }
}

export function setYouTubeVolume(volume: number) {
  if (ytReady && ytPlayer) {
    try {
      ytPlayer.setVolume(volume);
      if (volume > 0) ytPlayer.unMute();
    } catch { /* ignore */ }
  }
}

export function muteYouTubeVideo() {
  if (ytReady && ytPlayer) {
    try { ytPlayer.mute(); } catch { /* ignore */ }
  }
}

export function unMuteYouTubeVideo() {
  if (ytReady && ytPlayer) {
    try { ytPlayer.unMute(); } catch { /* ignore */ }
  }
}

export function getYouTubeTime(): number {
  try {
    if (ytReady && ytPlayer?.getCurrentTime) return ytPlayer.getCurrentTime() || 0;
  } catch { /* ignore */ }
  return 0;
}

export function getYouTubeDuration(): number {
  try {
    if (ytReady && ytPlayer?.getDuration) return ytPlayer.getDuration() || 0;
  } catch { /* ignore */ }
  return 0;
}

export function getYouTubeBuffered(): number {
  try {
    if (ytReady && ytPlayer?.getVideoLoadedFraction && ytPlayer?.getDuration) {
      return ytPlayer.getVideoLoadedFraction() * ytPlayer.getDuration() || 0;
    }
  } catch { /* ignore */ }
  return 0;
}

export function resetYTCurrentId() {
  currentVideoId = null;
}
