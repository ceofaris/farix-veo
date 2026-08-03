import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Shield,
  ArrowRight,
  Zap,
  Infinity as InfinityIcon,
  Lock,
  UserPlus,
  Puzzle,
  Play,
  Check,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farix AI — Premium AI Tools Behind One Secure Login" },
      {
        name: "description",
        content:
          "Farix AI gives teams and resellers managed access to premium AI tools — video, chat, image and voice — from one secure, invite-only platform.",
      },
      { property: "og:title", content: "Farix AI — Premium AI Tools Behind One Secure Login" },
      {
        property: "og:description",
        content:
          "Managed access to premium AI tools — video, chat, image and voice — from one secure platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

const marqueeLogos = [
  "Veo 3.1",
  "ChatGPT",
  "Google Flow",
  "Nano Banana",
  "Midjourney",
  "ElevenLabs",
  "Sora",
  "Claude",
];

const features = [
  {
    icon: Zap,
    title: "Instant Session Access",
    body: "Sign in once and your managed sessions are ready — no setup, no shared passwords.",
  },
  {
    icon: InfinityIcon,
    title: "Unlimited Usage",
    body: "Generate video, chat, images and voice with premium models. No daily caps.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    body: "Encrypted session storage with strict role-based access. Your data stays yours.",
  },
];

const steps = [
  {
    n: "01",
    icon: UserPlus,
    title: "Get your account",
    body: "Your reseller or admin issues your Farix AI credentials. No public signup.",
  },
  {
    n: "02",
    icon: Puzzle,
    title: "Install the extension",
    body: "Add the Farix extension to Chrome in a single click from your dashboard.",
  },
  {
    n: "03",
    icon: Play,
    title: "Start creating",
    body: "Open any assigned tool and start working — sessions are injected instantly.",
  },
];

const planFeatures = [
  "Unlimited access to assigned tools",
  "Veo 3, ChatGPT, Image & Voice models",
  "Managed accounts, always current",
  "Secure Chrome extension included",
  "Priority reseller support",
];

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-cta text-primary-foreground shadow-soft">
            <Shield className="h-4.5 w-4.5" />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">Farix AI</span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "How it works", href: "#how" },
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
          <Link
            to="/auth"
            className="hidden rounded-full px-4 py-2 font-display text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-cta px-5 py-2 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98]"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function LogoMarquee() {
  const row = [...marqueeLogos, ...marqueeLogos];
  return (
    <div className="relative mt-16 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-marquee items-center gap-4">
        {row.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="whitespace-nowrap rounded-2xl border border-border bg-card px-7 py-4 font-display text-lg font-semibold text-foreground/70 shadow-soft"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Landing() {
  // Landing page is light-theme only.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      if (wasDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-24 text-center sm:pt-32">
          <Reveal>
            <h1 className="font-sans text-[2.5rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[4.5rem]">
              <span className="text-gradient-metallic">Create with AI</span>
              <br />
              <span className="text-gradient-ocean">Without Hassle</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-9 flex justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-8 py-3.5 font-display font-semibold text-primary-foreground ring-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <LogoMarquee />
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Features
          </p>
          <h2 className="mt-4 text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            Built for creators, businesses and teams.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 100}>
                <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              How it works
            </p>
            <h2 className="mt-4 text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              Live in three steps.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.n} delay={i * 100}>
                  <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-pop">
                    <div className="flex items-start justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-display text-3xl font-extrabold text-muted-foreground/25">
                        {s.n}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal>
          <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            Pricing
          </p>
          <h2 className="mt-4 text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
            One plan. Everything unlocked.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
            Access is invite-only. Payments are handled directly through your reseller via WhatsApp,
            Telegram or bank transfer.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <div className="mx-auto mt-14 max-w-md">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-pop">
              <span aria-hidden className="block h-1 bg-gradient-cta" />
              <div className="p-8">
                <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Most popular
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em]">
                  Unlimited
                </h3>
                <p className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em]">
                  Contact{" "}
                  <span className="text-sm font-medium text-muted-foreground">your reseller</span>
                </p>
                <ul className="mt-7 space-y-3.5">
                  {planFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-cta text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-cta px-6 py-3 font-display font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
                >
                  Contact your Reseller <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-center text-[11px] tracking-wide text-muted-foreground">
                  WhatsApp · Telegram · Bank Transfer
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            Already have credentials?{" "}
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Sign in here →
            </Link>
          </p>
        </Reveal>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-cta text-primary-foreground">
              <Shield className="h-3 w-3" />
            </span>
            <span className="font-display font-semibold text-foreground">Farix AI</span>
            <span>© {new Date().getFullYear()} · All rights reserved</span>
          </span>
          <span>Invite-only access platform</span>
        </div>
      </footer>
    </div>
  );
}
