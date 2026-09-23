import { Shield, Database, Eye, Lock, Globe, Trash2, Mail } from "lucide-react";
import { SectionHeader } from "@/components/ui";

const SECTIONS = [
  {
    icon: Database,
    title: "What We Store",
    items: [
      "Your playlists, favourites, listening history, theme preferences and volume settings are saved in your browser's local storage.",
      "Your current play queue is saved in session storage (cleared when you close the tab).",
      "No data is ever sent to any AuraBeats server — because we don't have one.",
    ],
  },
  {
    icon: Eye,
    title: "What We Don't Collect",
    items: [
      "No personal information (name, email, phone).",
      "No analytics, tracking pixels, or fingerprinting.",
      "No cookies — not even for ads, because AuraBeats is 100% ad-free.",
      "No account creation, no login, no sign-up.",
    ],
  },
  {
    icon: Globe,
    title: "Third-Party Services",
    items: [
      "AuraBeats fetches music from JioSaavn, Audius, Jamendo, Internet Archive, YouTube (via Piped mirrors), and the Radio Browser API.",
      "When you play or search, your browser connects directly to these services. AuraBeats does not proxy, log, or store any of these requests.",
      "Each service has its own privacy policy governing how they handle traffic. AuraBeats has no access to their server logs.",
      "Google Fonts (Outfit) is loaded from Google's CDN. Google may log font requests under their own privacy policy.",
    ],
  },
  {
    icon: Lock,
    title: "Security",
    items: [
      "All connections use HTTPS (TLS encryption).",
      "The app runs entirely in your browser — no server-side code, no backend, no database.",
      "Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) are set via Cloudflare.",
    ],
  },
  {
    icon: Trash2,
    title: "Deleting Your Data",
    items: [
      "Go to Settings → scroll to the bottom → 'Clear all data'. This wipes everything AuraBeats has ever stored in your browser.",
      "Alternatively, clear your browser's site data for aurabeats.pages.dev.",
      "Since nothing lives on a server, deletion is instant and permanent.",
    ],
  },
];

export function PrivacyView() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-8">
      <section className="blur-panel glass-inset rounded-[2rem] px-6 py-8 sm:px-10 sm:py-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.05] px-3.5 py-1.5">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink2">Privacy Policy</span>
        </div>
        <h1 className="mb-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Your data stays yours.
        </h1>
        <p className="max-w-xl text-sm leading-relaxed" style={{ color: "var(--c-ink2)" }}>
          AuraBeats is a client-side web application. It has no server, no database, and no accounts.
          Everything you do — playlists, favourites, history, preferences — lives exclusively in your
          browser and never leaves your device.
        </p>
      </section>

      {SECTIONS.map(({ icon: Icon, title, items }) => (
        <section key={title}>
          <SectionHeader title={title} icon={<Icon className="h-4 w-4 text-accent" />} />
          <div className="blur-panel space-y-3 p-5">
            {items.map((text, i) => (
              <p key={i} className="flex gap-3 text-sm leading-relaxed" style={{ color: "var(--c-ink2)" }}>
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                {text}
              </p>
            ))}
          </div>
        </section>
      ))}

      <section>
        <SectionHeader title="Contact" icon={<Mail className="h-4 w-4 text-accent" />} />
        <div className="blur-panel p-5">
          <p className="text-sm leading-relaxed" style={{ color: "var(--c-ink2)" }}>
            If you have privacy concerns or questions, open an issue on the{" "}
            <a
              href="https://github.com/jakariatanjim-svg/aurabeats"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-accent hover:underline"
            >
              GitHub repository
            </a>.
          </p>
        </div>
      </section>

      <p className="text-center text-xs text-ink3 pt-4">
        Last updated: September 2026 · AuraBeats is open-source software.
      </p>
    </div>
  );
}
