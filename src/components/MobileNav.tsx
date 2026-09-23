import { Heart, Home, Library, Radio, Search } from "lucide-react";
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
    <nav className="blur-panel fixed inset-x-0 bottom-0 z-50 border-x-0! border-b-0! px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 md:hidden">
      <div className="grid grid-cols-5 gap-1.5">
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const active = route === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={cn(
                "focus-ring relative flex min-h-[4.1rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-all",
                active ? "bg-accent/14 text-accent shadow-[0_12px_28px_-20px_var(--c-accent)]" : "text-ink3 hover:bg-white/[0.04] hover:text-ink",
              )}
            >
              <span className="relative">
                <Icon className={cn("h-[18px] w-[18px] transition-all", active ? "scale-110 text-accent" : "text-current")} />
                {key === "favorites" && favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[14px] rounded-full bg-accent px-1 text-[9px] leading-[14px] font-bold text-white">
                    {favoritesCount > 99 ? "99+" : favoritesCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
              {active && <span className="absolute inset-x-4 top-0 h-[2px] rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
