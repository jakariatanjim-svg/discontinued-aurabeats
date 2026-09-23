import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { PlayerProvider, usePlayer } from "@/hooks/usePlayer";
import { ThemeProvider } from "@/hooks/useTheme";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TopBar } from "@/components/TopBar";
import { PlayerBar } from "@/components/PlayerBar";
import { Toaster } from "@/components/ui";
import { storage } from "@/utils/storage";
import { pathToRoute, routeToPath, type RouteKey } from "@/routes";
import { cn } from "@/utils/cn";

const HomeView = lazy(() => import("@/views/HomeView").then((m) => ({ default: m.HomeView })));
const SearchView = lazy(() => import("@/views/SearchView").then((m) => ({ default: m.SearchView })));
const RadioView = lazy(() => import("@/views/RadioView").then((m) => ({ default: m.RadioView })));
const SettingsView = lazy(() => import("@/views/SettingsView").then((m) => ({ default: m.SettingsView })));
const AboutView = lazy(() => import("@/views/AboutView").then((m) => ({ default: m.AboutView })));
const PrivacyView = lazy(() => import("@/views/PrivacyView").then((m) => ({ default: m.PrivacyView })));
const FavoritesView = lazy(() => import("@/views/LibraryViews").then((m) => ({ default: m.FavoritesView })));
const HistoryView = lazy(() => import("@/views/LibraryViews").then((m) => ({ default: m.HistoryView })));
const LibraryView = lazy(() => import("@/views/LibraryViews").then((m) => ({ default: m.LibraryView })));
const PlaylistDetailView = lazy(() => import("@/views/LibraryViews").then((m) => ({ default: m.PlaylistDetailView })));
const FullScreenPlayer = lazy(() => import("@/components/FullScreenPlayer").then((m) => ({ default: m.FullScreenPlayer })));
const QueuePanel = lazy(() => import("@/components/FullScreenPlayer").then((m) => ({ default: m.QueuePanel })));

function Shell() {
  // URL is the source of truth — real clean paths: /home /search /radio …
  const [route, setRoute] = useState<RouteKey>(() => pathToRoute(window.location.pathname));
  const [collapsed, setCollapsed] = useState<boolean>(() => storage.get("sidebarCollapsed", false));

  const scrollTop = useCallback(() => {
    const main = document.getElementById("ab-scroll");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const navigate = useCallback((next: RouteKey) => {
    const path = routeToPath(next);
    if (window.location.pathname === path) {
      scrollTop();
      return;
    }
    // Replace the bare "/" entry with "/home" so back-navigation stays inside the app.
    if (window.location.pathname === "/") window.history.replaceState(null, "", "/home");
    window.history.pushState(null, "", path);
    setRoute(next);
    scrollTop();
  }, [scrollTop]);

  // keep state in sync with the address bar (back / forward / pasted links)
  useEffect(() => {
    const onPop = () => {
      setRoute(pathToRoute(window.location.pathname));
      scrollTop();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [scrollTop]);

  // Intercept plain app links (href="/search" with data-nav) for SPA navigation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a[data-nav='true']") as HTMLAnchorElement | null;
      if (!anchor) return;
      e.preventDefault();
      window.history.pushState(null, "", anchor.pathname + anchor.search);
      setRoute(pathToRoute(window.location.pathname));
      scrollTop();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [scrollTop]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      storage.set("sidebarCollapsed", !c);
      return !c;
    });
  }, []);

  const { setExpanded, setQueueOpen, queueOpen, next, previous, toggle, current, favorites, volume, setVolume, settings, expanded } = usePlayer();

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
      // Is the full screen player currently mounted and visible?
      const isFullScreen = expanded;
      
      // If NOT in full screen, disable volume wheel over scrollable areas (so page can scroll normally)
      if (!isFullScreen && target?.closest(".scroll-area, main, aside, [role=dialog]")) return;
      
      // If IN full screen, ONLY disable volume wheel if hovering over the "Up Next" queue area
      if (isFullScreen && target?.closest(".scroll-area")) return;

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
  }, [toggle, next, previous, setExpanded, setQueueOpen, queueOpen, current, volume, setVolume, expanded]);

  return (
    <div className="flex h-screen w-full overflow-hidden p-0 sm:p-3 md:p-5 gap-4 relative z-0">
      <Sidebar route={route} onNavigate={navigate} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

      <div className="flex min-w-0 flex-1 flex-col relative z-10 h-full rounded-[2rem] blur-panel overflow-hidden border border-white/5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
        <TopBar route={route} onNavigate={navigate} />
        <main
          id="ab-scroll"
          className={cn(
            "scroll-area min-h-0 flex-1 overflow-y-auto px-4 pt-4 sm:px-8 transition-[padding] duration-300",
            // reserve room for the floating player bar only once it actually exists
            current
              ? "pb-[calc(env(safe-area-inset-bottom)+12rem)] md:pb-[calc(env(safe-area-inset-bottom)+9rem)]"
              : "pb-[calc(env(safe-area-inset-bottom)+6.5rem)] md:pb-10",
          )}
        >
          <Suspense
            fallback={
              <div className="blur-panel p-6 animate-fade-in">
                <div className="skeleton h-4 w-32 rounded-full" />
                <div className="mt-4 space-y-3">
                  <div className="skeleton h-10 w-full rounded-2xl" />
                  <div className="skeleton h-10 w-full rounded-2xl" />
                  <div className="skeleton h-10 w-full rounded-2xl" />
                </div>
              </div>
            }
          >
            <div key={route} className="animate-fade-up mx-auto w-full max-w-[1600px] pb-8">
              {route === "home" && <HomeView onNavigate={navigate} />}
              {route === "search" && <SearchView />}
              {route === "radio" && <RadioView />}
              {route === "library" && <LibraryView onNavigate={navigate} />}
              {route === "favorites" && <FavoritesView />}
              {route === "history" && <HistoryView />}
              {route === "settings" && <SettingsView />}
              {route === "about" && <AboutView />}
              {route === "privacy" && <PrivacyView />}
              {route.startsWith("playlist:") && (
                <PlaylistDetailView playlistId={route.slice("playlist:".length)} onBack={() => navigate("library")} />
              )}
            </div>
          </Suspense>
        </main>
      </div>

      <PlayerBar onOpenQueue={() => setQueueOpen(!queueOpen)} />
      <MobileNav route={route} onNavigate={navigate} favoritesCount={favorites.length} />
      <Suspense fallback={null}>
        {settings.queueEnabled && <QueuePanel />}
        <FullScreenPlayer />
      </Suspense>
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
