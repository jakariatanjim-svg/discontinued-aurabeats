// Singleton YouTube IFrame Player instance
let ytPlayer: any = null;
let ytReady = false;
let ytReadyPromise: Promise<void> | null = null;
let currentVideoId: string | null = null;

export function initYouTubePlayer() {
  if (ytReadyPromise) return ytReadyPromise;

  ytReadyPromise = new Promise((resolve) => {
    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Create a hidden container for the player
    const container = document.createElement("div");
    container.id = "yt-hidden-player-container";
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.opacity = "0";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);

    const playerDiv = document.createElement("div");
    playerDiv.id = "yt-hidden-player";
    container.appendChild(playerDiv);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytPlayer = new (window as any).YT.Player("yt-hidden-player", {
        height: "1",
        width: "1",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: () => {
            ytReady = true;
            resolve();
          },
          onStateChange: (event: any) => {
            // Forward events to custom dispatcher
            window.dispatchEvent(new CustomEvent("yt-state-change", { detail: event.data }));
          },
          onError: (event: any) => {
            window.dispatchEvent(new CustomEvent("yt-error", { detail: event.data }));
          }
        }
      });
    };
  });

  return ytReadyPromise;
}

export function playYouTubeVideo(videoId: string) {
  if (!ytReady) return;
  if (currentVideoId !== videoId) {
    ytPlayer.loadVideoById(videoId);
    currentVideoId = videoId;
  } else {
    ytPlayer.playVideo();
  }
}

export function pauseYouTubeVideo() {
  if (ytReady && ytPlayer) ytPlayer.pauseVideo();
}

export function seekYouTubeVideo(seconds: number) {
  if (ytReady && ytPlayer) ytPlayer.seekTo(seconds, true);
}

export function setYouTubeVolume(volume: number) { // 0 to 100
  if (ytReady && ytPlayer) {
    ytPlayer.setVolume(volume);
    if (volume > 0) ytPlayer.unMute();
  }
}

export function muteYouTubeVideo() {
  if (ytReady && ytPlayer) ytPlayer.mute();
}

export function unMuteYouTubeVideo() {
  if (ytReady && ytPlayer) ytPlayer.unMute();
}

export function getYouTubeTime(): number {
  if (ytReady && ytPlayer && ytPlayer.getCurrentTime) {
    return ytPlayer.getCurrentTime() || 0;
  }
  return 0;
}

export function getYouTubeDuration(): number {
  if (ytReady && ytPlayer && ytPlayer.getDuration) {
    return ytPlayer.getDuration() || 0;
  }
  return 0;
}

export function getYouTubeBuffered(): number {
  if (ytReady && ytPlayer && ytPlayer.getVideoLoadedFraction && ytPlayer.getDuration) {
    return ytPlayer.getVideoLoadedFraction() * ytPlayer.getDuration() || 0;
  }
  return 0;
}
