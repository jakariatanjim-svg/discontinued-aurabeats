import {
  Check,
  Database,
  DownloadCloud,
  Info,
  Moon,
  Palette,
  Radio as RadioIcon,
  RefreshCw,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { ACCENTS, useTheme } from "@/hooks/useTheme";
import { usePlayer } from "@/hooks/usePlayer";
import { invalidateFeeds } from "@/hooks/useFeed";
import { resetHostHealth } from "@/services/audius";
import { Button, SectionHeader, Slider } from "@/components/ui";
import { storage } from "@/utils/storage";

export function SettingsView() {
  const { theme, setTheme, mode, setMode, accent, setAccent } = useTheme();
  const { volume, setVolume, toast, favorites, history, playlists, settings, updateSettings, clearOffline } = usePlayer();

  const bytes = storage.bytes();

  return (
    <div className="space-y-8 pb-4">
      <div className="blur-panel p-5">
        <p className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase">Appearance</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">Dual core theme engine</h2>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink3">
          Switch instantly between two completely different rendering cores. Your choice, mode and accent are remembered
          on this device.
        </p>
      </div>

      <section>
        <SectionHeader title="Theme core" subtitle="Glassmorphism or premium flat" icon={<Sparkles className="h-4 w-4 text-accent" />} />
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                key: "glassy" as const,
                name: "Glassy",
                desc: "Frosted translucent panels, neon borders, glowing gradients and blur depth.",
                preview: (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-md">
                      <div className="h-1.5 w-2/3 rounded-full bg-white/50" />
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/5 p-2 backdrop-blur-md">
                      <div className="h-1.5 w-1/2 rounded-full bg-white/40" />
                    </div>
                  </div>
                ),
              },
              {
                key: "modern" as const,
                name: "Modern",
                desc: "Flat, high contrast, distraction free — the premium streaming app feel.",
                preview: (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-black/10 bg-black/[0.06] p-2 dark:border-white/10 dark:bg-white/10">
                      <div className="h-1.5 w-2/3 rounded-full bg-current opacity-50" />
                    </div>
                    <div className="rounded-xl border border-black/10 bg-black/[0.03] p-2 dark:border-white/10 dark:bg-white/5">
                      <div className="h-1.5 w-1/2 rounded-full bg-current opacity-35" />
                    </div>
                  </div>
                ),
              },
            ]
          ).map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setTheme(opt.key)}
              className={cn(
                "blur-panel p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
                theme === opt.key && "glow-ring border-accent/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">{opt.name}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink3">{opt.desc}</p>
                </div>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                    theme === opt.key ? "border-accent bg-accent text-white" : "border-line",
                  )}
                >
                  {theme === opt.key && <Check className="h-3 w-3" />}
                </span>
              </div>
              <div className="mt-3">{opt.preview}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Brightness mode" subtitle="Dark for the club, light for the desk" />
        <div className="blur-panel flex w-fit gap-1 p-1">
          {(
            [
              { key: "dark" as const, label: "Dark", icon: Moon },
              { key: "light" as const, label: "Light", icon: Sun },
            ]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                "focus-ring flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition",
                mode === key ? "bg-accent text-white" : "text-ink3 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Accent colour"
          subtitle="Tints every control, slider, glow and visualizer"
          icon={<Palette className="h-4 w-4 text-accent" />}
        />
        <div className="blur-panel p-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {ACCENTS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAccent(a.value)}
                className="focus-ring group flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "relative h-11 w-11 rounded-2xl transition-transform group-hover:scale-105",
                    accent.toLowerCase() === a.value.toLowerCase() && "ring-2 ring-ink ring-offset-2 ring-offset-[var(--c-base)]",
                  )}
                  style={{ background: `linear-gradient(135deg, ${a.value}, ${a.value}aa)` }}
                >
                  {accent.toLowerCase() === a.value.toLowerCase() && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white drop-shadow" />
                    </span>
                  )}
                </span>
                <span className="text-[10px] text-ink3">{a.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-ink2">
              Custom
              <span className="relative h-8 w-8 overflow-hidden rounded-lg border border-line" style={{ background: accent }}>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="absolute -top-3 -left-3 h-14 w-14 cursor-pointer opacity-0"
                  aria-label="Custom accent colour"
                />
              </span>
            </label>
            <code className="rounded-md bg-ink/10 px-2 py-1 text-[11px] text-ink3">{accent.toUpperCase()}</code>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Playback" subtitle="Applies to every stream in the app" icon={<Volume2 className="h-4 w-4 text-accent" />} />
        <div className="blur-panel space-y-4 p-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-ink2">
              <span>Default volume</span>
              <span className="tabular-nums text-ink3">{Math.round(volume * 100)}%</span>
            </div>
            <Slider ariaLabel="Default volume" value={volume * 100} max={100} onChange={(v) => setVolume(v / 100)} />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-ink3">
            <span className="rounded-full border border-line px-2.5 py-1">Engine: HTML5 Audio (direct stream)</span>
            <span className="rounded-full border border-line px-2.5 py-1">Full-length tracks · never 30s previews</span>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Experimental" subtitle="New features being tested — may change in future updates" icon={<Shield className="h-4 w-4 text-accent" />} />
        <div className="blur-panel space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink flex items-center gap-2">
                Playback queue
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold tracking-wider text-accent uppercase">Beta</span>
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink3">
                Enable advanced queue management, "play next" and the "up next" panel in the full-screen player. This feature is under active development — your feedback shapes its future.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ queueEnabled: !settings.queueEnabled })}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                settings.queueEnabled ? "bg-accent" : "bg-ink/15"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 left-1 h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
                  settings.queueEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
          <div className="border-t border-line pt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink">Direct Downloads</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink3">
                Export any track as an MP3 for offline listening. Subject to source availability.
              </p>
            </div>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent uppercase">Live</span>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Your data" subtitle="Everything lives in this browser only" icon={<Database className="h-4 w-4 text-accent" />} />
        <div className="blur-panel space-y-3 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Favourites", value: favorites.length },
              { label: "Playlists", value: playlists.length },
              { label: "History", value: history.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line p-3">
                <p className="text-xl font-black text-ink">{s.value}</p>
                <p className="text-[10px] tracking-wide text-ink3 uppercase">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-ink3">Local storage footprint: {(bytes / 1024).toFixed(1)} KB</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => {
                resetHostHealth();
                invalidateFeeds();
                toast("Re-negotiating open network mirrors…", "success");
                window.setTimeout(() => window.location.reload(), 550);
              }}
              className="justify-start"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh open sources
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!window.confirm("Clear app shell cache? This may fix loading issues but requires a redownload on next visit.")) return;
                window.caches.keys().then((keys) => {
                  Promise.all(keys.map((k) => window.caches.delete(k))).then(() => {
                    toast("App cache cleared — reloading", "success");
                    window.location.reload();
                  });
                });
              }}
              className="justify-start border-yellow-500/30 text-yellow-400 hover:border-yellow-500 hover:text-yellow-300"
            >
              <Shield className="h-3.5 w-3.5" /> Clear app cache
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!window.confirm("Delete all downloaded music? This will remove all offline tracks.")) return;
                clearOffline();
              }}
              className="justify-start border-rose-500/30 text-rose-400 hover:border-rose-500 hover:text-rose-300"
            >
              <DownloadCloud className="h-3.5 w-3.5" /> Clear offline media
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!window.confirm("Clear all favourites, playlists and history? Your downloaded music will stay.")) return;
                storage.clearAll();
                window.location.reload();
              }}
              className="justify-start border-rose-500/40 text-rose-400 hover:border-rose-500 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear app data
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Sources & privacy" subtitle="Zero keys, zero accounts, zero limits" icon={<Shield className="h-4 w-4 text-accent" />} />
        <div className="space-y-3">
          <SourceCard
            icon={<Database className="h-4 w-4" />}
            title="Internet Archive · open music"
            body="Millions of Creative-Commons and public-domain recordings: net labels, community uploads, artist-approved live concerts and restored 78rpm classics. Complete songs are streamed as direct MP3 from the Archive's storage nodes — never a preview clip."
            tags={["advancedsearch.php", "/metadata/{id}", "full-length MP3", "multi-node mirrors"]}
          />
          <SourceCard
            icon={<RadioIcon className="h-4 w-4" />}
            title="Audius open network"
            body="Decentralised, artist-owned catalogue. Public discovery nodes are queried live for popularity charts, fresh releases, genre feeds and search. Full tracks stream straight from open content nodes."
            tags={["/v1/tracks/trending", "/v1/tracks/search", "full tracks", "mirror fail-over"]}
          />
          <SourceCard
            icon={<RadioIcon className="h-4 w-4" />}
            title="Radio Browser open archive"
            body="Community-maintained directory of worldwide live radio stations with continuous availability checks. Only verified HTTPS direct streams are listed; HLS-only entries are filtered out so playback never stalls."
            tags={["/json/stations/search", "5 public mirrors", "broken-stream filter"]}
          />
          <SourceCard
            icon={<Info className="h-4 w-4" />}
            title="Resilience & zero cost"
            body="No API keys, no accounts, no paid tiers, no official/commercial APIs and no preview clips. Every request rotates through a pool of public mirrors; if a stream errors or stalls for 11 seconds the player retries the next endpoint, then another mirror, then hops to the next track — the UI never breaks."
            tags={["stall watchdog", "mirror rotation", "auto-skip", "offline cache", "$0 forever"]}
          />
        </div>
      </section>

      <p className="pb-2 text-center text-[10px] leading-relaxed text-ink3">
        AuraBeats · built with Vite, React, Tailwind CSS and Lucide · all audio remains the property of its creators and
        is streamed from public open endpoints.
      </p>
    </div>
  );
}

function SourceCard({ icon, title, body, tags }: { icon: React.ReactNode; title: string; body: string; tags: string[] }) {
  return (
    <div className="blur-panel p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent">{icon}</span>
        {title}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-ink3">{body}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[10px] text-ink3">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
