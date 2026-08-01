import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  ArrowRight,
  Video,
  MessageSquare,
  ImageIcon,
  AudioLines,
  Zap,
  Lock,
  Layers,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/reveal";

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
    badge: "NEW",
    badgeTone: "text-[oklch(0.72_0.2_300)]",
    image: toolVideo,
    icon: Video,
  },
  {
    name: "ChatGPT Access",
    kind: "Chat Model",
    description: "Premium chat, deep research and reasoning in one workspace.",
    badge: "LIVE",
    badgeTone: "text-[oklch(0.78_0.16_160)]",
    image: toolChat,
    icon: MessageSquare,
  },
  {
    name: "Image Lab",
    kind: "Image Model",
    description: "High-fidelity generation and editing for brand-ready assets.",
    badge: "HOT",
    badgeTone: "text-[oklch(0.78_0.16_60)]",
    image: toolImage,
    icon: ImageIcon,
  },
  {
    name: "Voice & TTS",
    kind: "Audio Model",
    description: "Natural text-to-speech and voice cloning in 30+ languages.",
    badge: "NEW",
    badgeTone: "text-[oklch(0.72_0.2_300)]",
    image: toolVoice,
    icon: AudioLines,
  },
];

const plans = [
  {
    name: "Veo 3 Access",
    accent: "bg-gradient-to-r from-[oklch(0.6_0.25_296)] to-[oklch(0.7_0.22_320)]",
    features: [
      "Unlimited Flow videos",
      "Veo 3 Lite model",
      "Nano Banana image generation",
      "Nano Banana Pro",
    ],
  },
  {
    name: "ChatGPT Access",
    accent: "bg-gradient-to-r from-[oklch(0.72_0.15_175)] to-[oklch(0.75_0.16_155)]",
    features: [
      "Full premium ChatGPT access",
      "Latest models included",
      "Deep research & reasoning",
      "Voice mode & image generation",
    ],
  },
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-cta text-primary-foreground shadow-soft">
            <Shield className="h-4.5 w-4.5" />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">
            Farix <span className="text-gradient-soft">AI</span>
          </span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {[
            { label: "Home", href: "#home" },
            { label: "Tools", href: "#tools" },
            { label: "About", href: "#about" },
            { label: "Pricing", href: "#pricing" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 font-display text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <ThemeToggle />
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full bg-gradient-cta px-5 py-2 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98]"
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
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-25%,color-mix(in_oklab,var(--brand-violet)_42%,transparent),transparent_62%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-24 h-[30rem] w-[30rem] rounded-full bg-[var(--brand-pink)]/18 blur-[170px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-0 h-[30rem] w-[30rem] rounded-full bg-[var(--brand-cyan)]/14 blur-[170px]"
        />
        <div className="relative mx-auto max-w-5xl px-5 pb-28 pt-28 text-center sm:pb-40 sm:pt-36">
          <Reveal>
            <h1 className="font-display text-[2.4rem] font-extrabold leading-[1.05] tracking-[-0.045em] text-foreground sm:whitespace-nowrap sm:text-[4.25rem]">
              Create with <span className="text-gradient-soft">AI</span> Without Limits.
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-8 py-3.5 font-display font-semibold text-primary-foreground ring-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#tools"
                className="inline-flex items-center rounded-full border border-border bg-card/50 px-7 py-3.5 font-display font-medium backdrop-blur transition hover:border-primary/40 hover:bg-accent"
              >
                Explore Tools
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Tools showcase */}
      <section id="tools" className="mx-auto max-w-6xl px-5 pb-28">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Reveal key={tool.name} delay={i * 90}>
                <article className="glow-frame group relative h-[26rem] overflow-hidden rounded-3xl border border-border/70 bg-card transition-transform duration-500 ease-out hover:-translate-y-1">
                  <img
                    src={tool.image}
                    alt={`${tool.name} preview`}
                    width={1024}
                    height={1280}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[oklch(0.08_0.01_285)] via-[oklch(0.08_0.01_285)]/60 to-transparent"
                  />

                  <span
                    className={cn(
                      "absolute left-4 top-4 z-10 rounded-full bg-[oklch(0.12_0.01_285)]/70 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md",
                      tool.badgeTone,
                    )}
                  >
                    {tool.badge}
                  </span>
                  <span className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-[oklch(0.12_0.01_285)]/70 text-[oklch(0.97_0_0)] backdrop-blur-md">
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-[oklch(0.8_0.02_285)]">
                      {tool.kind}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold leading-tight tracking-[-0.02em] text-[oklch(0.99_0_0)]">
                      {tool.name}
                    </h3>
                    <p className="mt-2 line-clamp-1 text-xs leading-relaxed text-[oklch(0.78_0.01_285)]">
                      {tool.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* About */}
      <section id="about" className="relative overflow-hidden border-y border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-primary/15 blur-[150px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-[var(--brand-pink)]/12 blur-[150px]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 py-28 md:grid-cols-2 md:items-center">
          <Reveal>
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                About
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.75rem] sm:leading-[1.05]">
                Built for teams and <span className="text-gradient-soft">resellers.</span>
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
                Farix AI is a private access platform. Admins manage tools and sessions centrally,
                resellers manage their own users, and members simply sign in and start working — no
                personal accounts, no shared passwords, no setup.
              </p>
            </div>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                t: "Managed sessions",
                d: "Access handled centrally — nothing to configure.",
                icon: Layers,
              },
              {
                t: "Role-based access",
                d: "King, reseller and user scopes kept strictly separate.",
                icon: Shield,
              },
              {
                t: "Always current",
                d: "Latest tool builds delivered automatically.",
                icon: Zap,
              },
              {
                t: "Private by default",
                d: "Invite-only. No public signup, ever.",
                icon: Lock,
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.t} delay={i * 90}>
                  <div className="group h-full rounded-2xl border border-border/70 bg-card/60 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-card">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/12 text-primary shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-violet)_25%,transparent),0_10px_30px_-12px_color-mix(in_oklab,var(--brand-violet)_60%,transparent)] transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-base font-semibold">{f.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/12 blur-[170px]"
        />
        <div className="relative mx-auto max-w-5xl px-5 py-28 text-center">
          <Reveal>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Pricing
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.75rem] sm:leading-[1.05]">
              Access is invite-only.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Choose your plan and contact your reseller to get started. All accounts are issued by
              administrators.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 120}>
                <div className="group relative h-full overflow-hidden rounded-3xl border border-border/70 bg-card/60 text-left shadow-card backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/45">
                  <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", plan.accent)} />
                  <div className="flex h-full flex-col p-8">
                    <h3 className="font-display text-2xl font-bold tracking-[-0.02em]">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Contact your Reseller for price
                    </p>
                    <ul className="mt-7 flex-1 space-y-3.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm">
                          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-cta text-primary-foreground">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          <span className="text-foreground/90">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/auth"
                      className="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-cta px-6 py-3 font-display font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
                    >
                      Get Access <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200}>
            <p className="mt-10 text-sm text-muted-foreground">
              Already have credentials?{" "}
              <Link to="/auth" className="font-medium text-primary hover:underline">
                Sign in here →
              </Link>
            </p>
          </Reveal>
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
