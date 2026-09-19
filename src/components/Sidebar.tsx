import { useState } from "react";
import {
  ChevronLeft,
  Clock,
  Heart,
  Home,
  Library,
  ListMusic,
  Plus,
  Radio,
  Search,
  Settings,
  AudioWaveform,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { usePlayer } from "@/hooks/usePlayer";
import { Artwork, IconButton } from "@/components/ui";
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
  { key: "history", label: "Recently Played", icon: Clock },
  { key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
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

  const Item = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const active = route === item.key;
    const badge =
      item.key === "favorites" ? favorites.length : item.key === "history" ? history.length : undefined;
    return (
      <button
        type="button"
        onClick={() => onNavigate(item.key)}
        title={item.label}
        className={cn(
          "focus-ring group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
          active ? "bg-accent/15 text-accent" : "text-ink2 hover:bg-ink/[0.07] hover:text-ink",
          collapsed && "justify-center px-0",
        )}
      >
        {active && <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
        <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "drop-shadow-[0_0_8px_var(--c-accent)]")} />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] tabular-nums text-ink3">{badge}</span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={cn(
        "blur-panel relative z-30 hidden h-full shrink-0 flex-col rounded-none! border-y-0! border-l-0! transition-[width] duration-300 md:flex",
        collapsed ? "w-[4.75rem]" : "w-[16.5rem]",
      )}
    >
      <div className={cn("flex items-center justify-between gap-2.5 px-4 pt-5 pb-4", collapsed && "justify-center px-2")}>
        <div className={cn("flex items-center gap-2.5 min-w-0", collapsed && "justify-center") }>
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-[0_0_22px_-4px_var(--c-accent)]">
            <AudioWaveform className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[15px] leading-tight font-black tracking-tight text-ink">AuraBeats</p>
              <p className="truncate text-[10px] font-medium tracking-wide text-ink3 uppercase">Pure Sound</p>
            </div>
          )}
        </div>
        <IconButton
          size="sm"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("border border-line", collapsed && "absolute right-2 top-5")}
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
        </IconButton>
      </div>

      {!collapsed && (
        <div className="mx-3 mb-6 animate-fade-in rounded-2xl border border-line bg-ink/[0.04] p-3.5 shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
            <ListMusic className="h-3.5 w-3.5 text-accent" /> Mult-Source Engine
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-ink3">
            Aggregating Jamendo, Audius, JioSaavn and HearThis for fast, unrestricted streaming.
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto scroll-area px-3 pb-24">
        <div className="space-y-1">
          {MAIN.map((item) => (
            <Item key={item.key} item={item} />
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
                  className={cn(
                    "focus-ring flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-ink/[0.07]",
                    route === `playlist:${p.id}` && "bg-ink/[0.07]",
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
            <Item key={item.key} item={item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
