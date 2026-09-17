import { Heart, Home, Library, Radio, Search, Settings } from "lucide-react";
import { cn } from "@/utils/cn";
import type { RouteKey } from "@/routes";

const ITEMS: { key: RouteKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "search", label: "Search", icon: Search },
  { key: "radio", label: "Radio", icon: Radio },
  { key: "library", label: "Library", icon: Library },
  { key: "favorites", label: "Saved", icon: Heart },
];

export function MobileNav({
  route,
  onNavigate,
  favoritesCount,
}: {
  route: RouteKey;
  onNavigate: (r: RouteKey) => void;
  favoritesCount: number;
}) {
  return (
    <nav className="blur-panel fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around rounded-none! border-x-0! border-b-0! pb-[env(safe-area-inset-bottom)] md:hidden">
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const active = route === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate(key)}
            className="focus-ring relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors"
          >
            <span className="relative">
              <Icon className={cn("h-[18px] w-[18px] transition-all", active ? "text-accent scale-110" : "text-ink3")} />
              {key === "favorites" && favoritesCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] rounded-full bg-accent px-1 text-[9px] leading-[14px] font-bold text-white">
                  {favoritesCount > 99 ? "99+" : favoritesCount}
                </span>
              )}
            </span>
            <span className={cn(active ? "text-accent" : "text-ink3")}>{label}</span>
            {active && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-accent" />}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onNavigate("settings")}
        className={cn("focus-ring relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold")}
        aria-label="Settings"
      >
        <Settings className={cn("h-[18px] w-[18px]", route === "settings" ? "text-accent" : "text-ink3")} />
        <span className={route === "settings" ? "text-accent" : "text-ink3"}>Theme</span>
      </button>
    </nav>
  );
}
