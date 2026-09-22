import { Archive, AudioWaveform, Globe, Heart, Mic2, Music2, Radio, Shield } from "lucide-react";
import { SectionHeader } from "@/components/ui";

const SOURCES = [
  {
    icon: Music2,
    name: "JioSaavn",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    description: "Massive mainstream database covering Bollywood, regional, and international music. Delivers fast direct audio at up to 320 kbps.",
    type: "Licensed Database",
  },
  {
    icon: Mic2,
    name: "Audius",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    description: "Open, decentralised artist network. Tracks are uploaded directly by artists and streamed peer-to-peer. No gatekeeper.",
    type: "Open Artist Network",
  },
  {
    icon: Heart,
    name: "Jamendo",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    description: "Independent music library under Creative Commons licenses. Artists release here for free sharing and exposure.",
    type: "Creative Commons",
  },
  {
    icon: Archive,
    name: "Internet Archive",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    description: "Public-domain and netlabel recordings, live concerts, and historical audio. All available for free, forever.",
    type: "Public Domain",
  },
  {
    icon: Radio,
    name: "Radio Browser",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    description: "Community-maintained directory of thousands of public live radio stations worldwide. Nonstop streams, no account needed.",
    type: "Live Radio",
  },
];

const PRINCIPLES = [
  {
    icon: Shield,
    title: "No API keys, no accounts, no payment",
    body: "Every source AuraBeats uses is free and publicly accessible. No credentials are stored on our end, and no data leaves your browser.",
  },
  {
    icon: Globe,
    title: "Zero lock-in",
    body: "Your favorites, playlists and listening history live entirely in your own browser's localStorage. Clear it anytime.",
  },
  {
    icon: AudioWaveform,
    title: "Full-length tracks only",
    body: "AuraBeats never plays 30-second previews. Every track is a complete, full-length recording — the same policy applied to every source.",
  },
  {
    icon: Music2,
    title: "Open streaming, explained",
    body: '"Open streaming" means AuraBeats pulls audio from public APIs, open networks, and community-maintained archives — not from licensed exclusive catalogs. Coverage varies by region and catalog changes over time.',
  },
];

export function AboutView() {
  return (
    <div className="space-y-10 pb-4">
      <section>
        <SectionHeader
          title="About AuraBeats"
          subtitle="How it works, where the music comes from, and what open streaming means"
          icon={<AudioWaveform className="h-5 w-5 text-accent" />}
        />
        <p className="max-w-3xl text-sm leading-7 text-ink2">
          AuraBeats is an open-source browser music player that aggregates multiple free public music
          networks into a single premium experience. No ads, no sign-up, no subscriptions. Just music.
        </p>
      </section>

      <section id="about-sources">
        <SectionHeader
          title="Where the music comes from"
          subtitle="5 independent sources — each with its own catalog, type, and coverage"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOURCES.map(({ icon: Icon, name, color, bg, description, type }) => (
            <div
              key={name}
              className="blur-panel glass-inset flex flex-col gap-4 rounded-[1.75rem] p-5"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-base font-black text-ink">{name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${bg} ${color}`}>{type}</span>
                </div>
                <p className="text-sm leading-6 text-ink2">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about-principles">
        <SectionHeader
          title="How it works"
          subtitle="The principles behind open streaming and why AuraBeats is different"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="blur-panel glass-inset flex gap-4 rounded-[1.75rem] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-ink">{title}</p>
                <p className="text-sm leading-6 text-ink2">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 sm:p-8" id="about-open-source">
        <SectionHeader title="Open source" subtitle="AuraBeats is fully open source on GitHub" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-sm leading-7 text-ink2">
            The entire codebase — UI, source integrations, player engine, and theme system — is
            publicly available. You can read, fork, self-host, or contribute.
          </p>
          <a
            href="https://github.com/jakariatanjim-svg/aurabeats"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-bold text-white shadow-[0_14px_34px_-16px_var(--c-accent)] transition hover:brightness-110"
          >
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
