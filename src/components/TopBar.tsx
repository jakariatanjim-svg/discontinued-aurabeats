import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Moon, Palette, Search, Sparkles, Sun, Wifi, AudioWaveform } from "lucide-react";
import { cn } from "@/utils/cn";
import { ACCENTS, useTheme } from "@/hooks/useTheme";
import { routeLabel, type RouteKey } from "@/routes";
import { IconButton } from "@/components/ui";
import { usePlayer } from "@/hooks/usePlayer";

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="blur-panel flex items-center gap-0.5 p-1">
      {(
        [
          { key: "glassy", label: "Glassy", icon: Sparkles },
          { key: "modern", label: "Modern", icon: Palette },
        ] as const
      ).map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key)}
          className={cn(
            "focus-ring flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all duration-200",
            theme === key ? "bg-accent text-white shadow-[0_4px_18px_-6px_var(--c-accent)]" : "text-ink3 hover:text-ink",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

function ModeSwitch() {
  const { mode, toggleMode } = useTheme();
  return (
    <IconButton onClick={toggleMode} aria-label="Toggle light / dark" className="border border-line">
      {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </IconButton>
  );
}

function AccentPicker() {
  const { accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <IconButton onClick={() => setOpen((v) => !v)} aria-label="Accent colour" className="border border-line">
        <span
          className="h-4 w-4 rounded-full"
          style={{ background: "linear-gradient(135deg, var(--c-accent2), var(--c-accent))" }}
        />
      </IconButton>
      {open && (
        <div className="blur-panel absolute top-12 right-0 z-[70] w-[15rem] animate-scale-in p-3.5 shadow-2xl">
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-ink3 uppercase">
            <Palette className="h-3 w-3" /> Accent colour
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                title={a.name}
                onClick={() => setAccent(a.value)}
                className={cn(
                  "focus-ring relative flex h-9 items-center justify-center rounded-xl transition-transform hover:scale-105",
                  accent.toLowerCase() === a.value.toLowerCase() && "ring-2 ring-ink",
                )}
                style={{ background: `linear-gradient(135deg, ${a.value}, ${a.value}cc)` }}
              >
                {accent.toLowerCase() === a.value.toLowerCase() && <Check className="h-4 w-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-xs text-ink2 transition hover:border-accent">
            Custom colour
            <span className="relative h-6 w-6 overflow-hidden rounded-full border border-line" style={{ background: accent }}>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer opacity-0"
                aria-label="Custom accent colour"
              />
            </span>
          </label>
          <p className="mt-2.5 text-[10px] leading-relaxed text-ink3">
            Accents tint every control, progress bar and glow in real time.
          </p>
        </div>
      )}
    </div>
  );
}

export function TopBar({
  route,
  onNavigate,
  onToggleSidebar,
}: {
  route: RouteKey;
  onNavigate: (r: RouteKey) => void;
  onToggleSidebar: () => void;
}) {
  const { failoverNote } = usePlayer();
  const live = route === "radio";

  return (
    <header className="blur-panel glass-inset sticky top-0 z-40 flex items-center gap-4 rounded-none! border-x-0! border-t-0! px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="focus-ring flex items-center gap-2 md:hidden"
        aria-label="Toggle navigation"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent2 text-white shadow-lg">
          <AudioWaveform className="h-5 w-5 drop-shadow" />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-black tracking-tight text-ink sm:text-xl drop-shadow-sm">{routeLabel(route)}</p>
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink3 sm:text-xs">
          <Wifi className="h-3.5 w-3.5 text-accent drop-shadow-[0_0_8px_var(--c-accent)]" />
          {failoverNote ? (
            <span className="text-accent">{failoverNote}</span>
          ) : live ? (
            "Open radio archive · live streams"
          ) : (
            "Pure multi-source streaming engine"
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onNavigate("search")}
        className="focus-ring glass-inset hidden items-center gap-2 rounded-full border border-line/80 bg-white/[0.03] px-4 py-2.5 text-xs text-ink3 transition hover:border-accent hover:text-accent lg:flex"
      >
        <Search className="h-3.5 w-3.5" />
        Search millions of open tracks
        <ChevronDown className="h-3 w-3 -rotate-90 opacity-60" />
      </button>

      <ThemeSwitch />
      <ModeSwitch />
      <AccentPicker />
    </header>
  );
}
