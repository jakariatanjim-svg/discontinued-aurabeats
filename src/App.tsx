import { useCallback, useEffect, useState } from "react";
import { PlayerProvider, usePlayer } from "@/hooks/usePlayer";
import { ThemeProvider } from "@/hooks/useTheme";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TopBar } from "@/components/TopBar";
import { PlayerBar } from "@/components/PlayerBar";
import { FullScreenPlayer, QueuePanel } from "@/components/FullScreenPlayer";
import { Toaster } from "@/components/ui";
import { HomeView } from "@/views/HomeView";
import { SearchView } from "@/views/SearchView";
import { RadioView } from "@/views/RadioView";
import { FavoritesView, HistoryView, LibraryView, PlaylistDetailView } from "@/views/LibraryViews";
import { SettingsView } from "@/views/SettingsView";
import { storage } from "@/utils/storage";
import type { RouteKey } from "@/routes";

function Shell() {
  const [route, setRoute] = useState<RouteKey>(() => storage.get<RouteKey>("route", "home"));
  const [collapsed, setCollapsed] = useState<boolean>(() => storage.get("sidebarCollapsed", false));

  const navigate = useCallback((next: RouteKey) => {
    setRoute(next);
    storage.set("route", next);
    const main = document.getElementById("ab-scroll");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      storage.set("sidebarCollapsed", !c);
      return !c;
    });
  }, []);

  const { setExpanded, setQueueOpen, queueOpen, next, previous, toggle, current, favorites, volume, setVolume, settings } = usePlayer();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight" && e.shiftKey) {
        next();
      } else if (e.key === "ArrowLeft" && e.shiftKey) {
        previous();
      } else if (e.key === "Escape") {
        setQueueOpen(false);
      } else if (e.key.toLowerCase() === "f" && current) {
        setExpanded(true);
      } else if (e.key.toLowerCase() === "q" && settings.queueEnabled) {
        setQueueOpen(!queueOpen);
      }
    };
    // Mouse wheel volume control
    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      // If we are in FullScreen player, we ALWAYS want volume control unless scrolling the up-next list
      const isFullScreen = document.querySelector("[z-index='85']") || target?.closest(".fixed.inset-0");
      
      if (!isFullScreen && target?.closest(".scroll-area, main, aside, [role=dialog]")) return;
      // Still allow scrolling in the "Up Next" queue in full screen
      if (target?.closest(".scroll-area")) return;

      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setVolume(Math.min(1, Math.max(0, volume + delta)));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [toggle, next, previous, setExpanded, setQueueOpen, queueOpen, current, volume, setVolume]);

  return (
    <div className="flex h-screen w-full overflow-hidden p-0 sm:p-3 md:p-5 gap-4 relative z-0">
      <Sidebar route={route} onNavigate={navigate} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div className="flex min-w-0 flex-1 flex-col relative z-10 h-full rounded-[2rem] blur-panel overflow-hidden border border-white/5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
        <TopBar route={route} onNavigate={navigate} onToggleSidebar={toggleCollapse} />
        <main 
          id="ab-scroll" 
          className="scroll-area min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+12rem)] sm:px-8 md:pb-[calc(env(safe-area-inset-bottom)+9rem)]"
        >
          <div key={route} className="animate-fade-up mx-auto w-full max-w-[1600px] pb-8">
            {route === "home" && <HomeView onNavigate={navigate} />}
            {route === "search" && <SearchView />}
            {route === "radio" && <RadioView />}
            {route === "library" && <LibraryView onNavigate={navigate} />}
            {route === "favorites" && <FavoritesView />}
            {route === "history" && <HistoryView />}
            {route === "settings" && <SettingsView />}
            {route.startsWith("playlist:") && (
              <PlaylistDetailView playlistId={route.slice("playlist:".length)} onBack={() => navigate("library")} />
            )}
          </div>
        </main>
      </div>

      <PlayerBar onOpenQueue={() => setQueueOpen(!queueOpen)} />
      <MobileNav route={route} onNavigate={navigate} favoritesCount={favorites.length} />
      {settings.queueEnabled && <QueuePanel />}
      <FullScreenPlayer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PlayerProvider>
        <Shell />
      </PlayerProvider>
    </ThemeProvider>
  );
}
