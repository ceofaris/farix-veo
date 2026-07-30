import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Sparkles, ArrowRight, Video, MessageSquare, ImageIcon, AudioLines } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import toolVideo from "@/assets/tool-video.jpg";
import toolChat from "@/assets/tool-chat.jpg";
import toolImage from "@/assets/tool-image.jpg";
import toolVoice from "@/assets/tool-voice.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farix AI — Premium Multi-Tool AI Access Platform" },
      {
        name: "description",
        content:
          "Farix AI gives teams and resellers managed access to premium AI tools — video, chat, image and voice — from one secure platform.",
      },
      { property: "og:title", content: "Farix AI — Premium Multi-Tool AI Access Platform" },
      {
        property: "og:description",
        content:
          "Managed access to premium AI tools — video, chat, image and voice — from one secure platform.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const tools = [
  {
    name: "Veo Video Studio",
    kind: "Video Generation",
    description: "Cinematic AI video with sound, directed from a single prompt.",
    badge: "New",
    image: toolVideo,
    icon: Video,
  },
  {
    name: "ChatGPT Access",
    kind: "Chat Model",
    description: "Full premium chat, deep research and reasoning in one workspace.",
    badge: "Live",
    image: toolChat,
    icon: MessageSquare,
  },
  {
    name: "Image Lab",
    kind: "Image Model",
    description: "High-fidelity image generation and editing for brand-ready assets.",
    badge: "Hot",
    image: toolImage,
    icon: ImageIcon,
  },
  {
    name: "Voice & TTS",
    kind: "Audio Model",
    description: "Natural text-to-speech and voice cloning in 30+ languages.",
    badge: "New",
    image: toolVoice,
    icon: AudioLines,
  },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Shield className="h-4.5 w-4.5" />
          </span>
          <span className="truncate font-display text-lg font-semibold tracking-tight">
            Farix <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {[
            { label: "Home", href: "#home" },
            { label: "About", href: "#about" },
            { label: "Pricing", href: "#pricing" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <ThemeToggle />
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98]"
          >
            Sign In
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-primary/25 blur-[140px]"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Managed access to premium AI tools
          </span>
          <h1 className="mt-7 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Every AI tool.
            <br />
            <span className="text-primary">One secure login.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            Farix AI centrally manages access to the tools your team relies on — video, chat, image
            and voice. Invite-only, private, and always up to date.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-medium text-primary-foreground shadow-pop transition hover:opacity-90 active:scale-[0.98]"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#tools"
              className="inline-flex items-center rounded-full border border-border bg-card px-7 py-3.5 font-medium transition hover:bg-accent"
            >
              Explore Tools
            </a>
          </div>
        </div>
      </section>

      {/* Tools showcase */}
      <section id="tools" className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Showcase</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Latest AI Tools</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-muted-foreground sm:block">
            Every tool below is available instantly once your reseller activates your account.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <article
                key={tool.name}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-pop"
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src={tool.image}
                    alt={`${tool.name} preview`}
                    width={768}
                    height={512}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full border border-primary/30 bg-background/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary backdrop-blur">
                    {tool.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{tool.name}</h3>
                      <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                        {tool.kind}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {tool.description}
                  </p>
                  <Link
                    to="/auth"
                    className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium transition group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    Try Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-y border-border bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">About</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for teams and resellers.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Farix AI is a private access platform. Admins manage tools and sessions centrally,
              resellers manage their own users, and members simply sign in and start working — no
              personal accounts, no shared passwords, no setup.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { t: "Managed sessions", d: "Access handled centrally — nothing to configure." },
              { t: "Role-based access", d: "King, reseller and user scopes kept strictly separate." },
              { t: "Always current", d: "Latest tool builds delivered automatically." },
              { t: "Private by default", d: "Invite-only. No public signup, ever." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h3 className="text-sm font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-3xl px-5 py-24 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">Pricing</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Access is invite-only.
        </h2>
        <div className="mt-8 rounded-3xl border border-primary/25 bg-card p-10 shadow-card">
          <p className="text-lg font-medium">Contact your Reseller to get access</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Farix AI accounts are issued by administrators and resellers. Already have credentials?
            Sign in below.
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-medium text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98]"
          >
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Farix AI. All rights reserved.</span>
          <span>Invite-only access platform</span>
        </div>
      </footer>
    </div>
  );
}
