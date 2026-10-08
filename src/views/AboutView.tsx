import { Archive, Globe, Heart, Mic2, Music2, Radio, Shield, Sparkles } from "lucide-react";
import { SectionHeader, WaveformLogo } from "@/components/ui";

const SOURCES = [
  {
    icon: Music2,
    name: "YouTube Music",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    description: "The world's largest music catalog. AuraBeats uses a hybrid resolver to play high-quality audio streams without ads or tracking.",
    type: "Primary Source",
  },
  {
    icon: Music2,
    name: "JioSaavn",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    description: "Massive mainstream database covering Bollywood, regional, and international music. Delivers direct MP3 audio at up to 320 kbps.",
    type: "Licensed Database",
  },
  {
    icon: Mic2,
    name: "SoundCloud",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    description: "Indie artists, underground remixes, and unique user-uploaded content. Essential for discovery and alternative versions.",
    type: "Creative Network",
  },
  {
    icon: Mic2,
    name: "Audius",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    description: "Open, decentralised artist network. Tracks are uploaded directly by artists and streamed peer-to-peer.",
    type: "Indie Network",
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
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    description: "Public-domain recordings, live concerts, and historical audio. All available for free, forever.",
    type: "Public Domain",
  },
  {
    icon: Radio,
    name: "Radio Browser",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    description: "Community-maintained directory of thousands of public live radio stations worldwide. Nonstop streams.",
    type: "Live Radio",
  },
];

const PRINCIPLES = [
  {
    icon: Shield,
    title: "Privacy first",
    body: "No API keys, no accounts, and no tracking. Every request is anonymous and your preferences stay on your device.",
  },
  {
    icon: Sparkles,
    title: "Dual core engine",
    body: "Switch between Glassy and Modern themes instantly. AuraBeats is built for high-performance rendering on both mobile and PC.",
  },
  {
    icon: WaveformLogo,
    title: "Full-length tracks",
    body: "AuraBeats never plays 30-second previews. Every track is a complete, full-length recording from the source network.",
  },
  {
    icon: Globe,
    title: "Zero data collection",
    body: "Your playlists, history, and downloads live exclusively in your own browser's storage. Clear everything anytime.",
  },
];

export function AboutView() {
  return (
    <div className="mx-auto max-w-5xl space-y-12 pb-10">
      <section className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#3b82f6] to-[#22d3ee] text-white shadow-2xl">
          <WaveformLogo className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">AuraBeats</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink2 sm:text-lg">
          A multi-source streaming engine that aggregates the world's audio into one premium web experience. No sign-up. No ads. Just pure sound.
        </p>
      </section>

      <section id="about-sources">
        <SectionHeader
          title="Streaming sources"
          subtitle="AuraBeats connects to multiple independent audio networks simultaneously"
          icon={<Sparkles className="h-4 w-4 text-accent" />}
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
                <p className="text-sm leading-relaxed text-ink2">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="about-principles">
        <SectionHeader
          title="How it works"
          subtitle="The technology and values behind AuraBeats"
          icon={<Shield className="h-4 w-4 text-accent" />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="blur-panel glass-inset flex gap-5 rounded-[1.75rem] p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-1.5">
                <p className="text-base font-bold text-ink">{title}</p>
                <p className="text-sm leading-relaxed text-ink2">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="blur-panel glass-inset overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-12">
        <h2 className="text-2xl font-black text-ink sm:text-3xl">Ready to listen?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-ink2">
          No installation needed. No accounts to manage. AuraBeats runs entirely in your browser and stays ready even offline.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/jakariatanjim-svg/aurabeats"
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded-full border border-line bg-white/[0.05] px-8 py-3 text-sm font-bold text-ink transition hover:border-accent hover:text-accent"
          >
            GitHub Repository
          </a>
        </div>
      </section>

      <p className="text-center text-[10px] font-medium tracking-widest text-ink3 uppercase opacity-50">
        Built for performance · 2026 AuraBeats
      </p>
    </div>
  );
}
