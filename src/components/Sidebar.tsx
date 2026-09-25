import { memo, useState } from "react";
import {
  ChevronLeft,
  Clock,
  Heart,
  Home,
  Info,
  Library,
  ListMusic,
  Plus,
  Radio,
  Search,
  Settings,
  DownloadCloud,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePlayer } from "@/hooks/usePlayer";
import { Artwork, IconButton, WaveformLogo } from "@/components/ui";
import type { RouteKey } from "@/routes";

interface NavItem {
  key: RouteKey;
  label: string;
  icon: typeof Home;
}

const MAIN: NavItem[] = [
  { key: "home", label: "Discover", icon: Home },
  { key: "search", label: "Search", icon: Search },
  { key: "radio", label: "Live Radio", icon: Radio },
  { key: "library", label: "Your Library", icon: Library },
];

const COLLECTION: NavItem[] = [
  { key: "favorites", label: "Favourites", icon: Heart },
  { key: "downloads", label: "Downloads", icon: DownloadCloud },
  { key: "history", label: "Recently Played", icon: Clock },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "about", label: "About", icon: Info },
];

/**
 * Menu button — deliberately hoisted to module scope and memoized.
 *
 * Defining a component INSIDE <Sidebar> gives it a brand-new identity on every
 * render, so React unmounts and remounts every menu button whenever the player
 * context ticks. That remount churn destroyed hover/focus state and restarted
 * CSS transitions — the visible "menu flicker". A stable, memoized component
 * keeps the same DOM nodes alive across renders, so nothing ever flickers.
 */
const NavItemButton = memo(function NavItemButton({
  item,
  active,
  collapsed,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  onNavigate: (r: RouteKey) => void;
}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.key)}
      title={item.label}
      style={{ contain: "layout style paint", transform: "translateZ(0)" }}
      className={cn(
        "focus-ring relative flex items-center gap-3 rounded-2xl text-sm font-semibold transition-colors duration-150",
        active ? "bg-accent/15 text-accent" : "text-ink2 hover:bg-[rgba(255,255,255,0.05)] hover:text-ink",
        collapsed ? "mx-auto h-12 w-12 justify-center p-0" : "w-full px-4 py-3"
      )}
    >
      {active && !collapsed && <span className="absolute top-1/2 left-1 h-5 w-1 -translate-y-1/2 rounded-full bg-accent" />}
      <Icon className={cn("h-5 w-5 shrink-0", active && "drop-shadow-[0_0_8px_var(--c-accent)]")} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate text-left">{item.label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-ink">{badge}</span>
          )}
        </>
      )}
    </button>
  );
});

export const Sidebar = memo(function Sidebar({
  route,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  route: RouteKey;
  onNavigate: (r: RouteKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { playlists, createPlaylist, favorites, history } = usePlayer();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const badgeFor = (key: RouteKey): number | undefined =>
    key === "favorites" ? favorites.length : key === "history" ? history.length : undefined;

  return (
    <aside
      className={cn(
        "blur-panel glass-inset relative z-30 hidden h-full shrink-0 flex-col rounded-[2rem] border border-white/5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] transition-[width] duration-300 md:flex",
        collapsed ? "w-[5rem]" : "w-[17.5rem]",
      )}
      style={{ contain: "layout style paint" }}
    >
      <div className={cn("relative flex items-center pt-6 pb-4", collapsed ? "justify-center px-0" : "justify-between px-5")}>
        <div className={cn("flex items-center gap-3 min-w-0", collapsed && "hidden")}>
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_8px_20px_-6px_#3b82f6]">
            <WaveformLogo className="h-5 w-5" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base leading-tight font-black tracking-tight text-ink drop-shadow-sm">AuraBeats</p>
            <p className="truncate text-[10px] font-bold tracking-widest text-ink3 uppercase opacity-80">Pure Sound</p>
          </div>
        </div>

        {/* Simplified Toggle Button - Centers perfectly when collapsed */}
        <div className={cn(collapsed && "flex w-full justify-center")}>
          <IconButton
            size="sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "border border-line/50 transition-all hover:border-accent/50",
              collapsed && "h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_8px_20px_-6px_#3b82f6] border-none"
            )}
          >
            {collapsed ? (
               <WaveformLogo className="h-5 w-5" />
            ) : (
               <ChevronLeft className="h-4 w-4" />
            )}
          </IconButton>
        </div>
      </div>

      {!collapsed && (
        <div className="mx-3 mb-6 animate-fade-in rounded-[1.4rem] border border-line/80 bg-white/[0.03] p-3.5 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
            <ListMusic className="h-3.5 w-3.5 text-accent" /> Sound Engine
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink3">
            Aggregating YouTube Music, JioSaavn, Audius, Jamendo, Archive and live radio in one player.
          </p>
        </div>
      )}

      <nav className={cn("flex-1 space-y-6 overflow-y-auto scroll-area pb-24", collapsed ? "px-2" : "px-3")} style={{ contain: "layout style paint" }}>
        <div className="space-y-1">
          {MAIN.map((item) => (
            <NavItemButton
              key={item.key}
              item={item}
              active={route === item.key}
              collapsed={collapsed}
              badge={badgeFor(item.key)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        {!collapsed && (
          <div>
            <div className="mb-2 flex items-center justify-between px-3">
              <p className="text-[10px] font-bold tracking-[0.16em] text-ink3 uppercase">Your playlists</p>
              <IconButton
                size="sm"
                aria-label="Create playlist"
                onClick={() => {
                  const n = `My playlist ${playlists.length + 1}`;
                  createPlaylist(n);
                  onNavigate("library");
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </IconButton>
            </div>
            <div className="space-y-0.5">
              {playlists.length === 0 && !creating && (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="w-full rounded-xl border border-dashed border-line px-3 py-2.5 text-left text-xs text-ink3 transition hover:border-accent hover:text-accent"
                >
                  + Create your first playlist
                </button>
              )}
              {creating && (
                <form
                  className="px-1 pb-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    createPlaylist(name.trim());
                    setName("");
                    setCreating(false);
                    onNavigate("library");
                  }}
                >
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => {
                      if (!name.trim()) setCreating(false);
                    }}
                    placeholder="Playlist name"
                    className="w-full rounded-lg border border-accent/60 bg-ink/5 px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink3"
                  />
                </form>
              )}
              {playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onNavigate(`playlist:${p.id}` as RouteKey)}
                  style={{ contain: "layout style paint", transform: "translateZ(0)" }}
                  className={cn(
                    "focus-ring flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-[rgba(255,255,255,0.05)]",
                    route === `playlist:${p.id}` && "bg-[rgba(255,255,255,0.05)]",
                  )}
                >
                  <Artwork alt={p.name} src={p.tracks[0]?.artwork} className="h-8 w-8 shrink-0" rounded="rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-ink2 group-hover:text-ink">{p.name}</span>
                    <span className="block truncate text-[10px] text-ink3">{p.tracks.length} tracks</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {!collapsed && (
            <p className="mb-1 px-3 text-[10px] font-bold tracking-[0.16em] text-ink3 uppercase">Collection</p>
          )}
          {COLLECTION.map((item) => (
            <NavItemButton
              key={item.key}
              item={item}
              active={route === item.key}
              collapsed={collapsed}
              badge={badgeFor(item.key)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
});
