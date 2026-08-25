import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  UserRound,
  Puzzle,
  PlayCircle,
  Check,
  ChevronDown,
} from "lucide-react";
import { FarixMark } from "@/components/farix-logo";
import { Reveal } from "@/components/reveal";
import { MediaCard } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import markAsset from "@/assets/farix-mark.png.asset.json";
import clip1 from "@/assets/farix-clip-1.mp4.asset.json";
import clip2 from "@/assets/farix-clip-2.mp4.asset.json";
import clip3 from "@/assets/farix-clip-3.mp4.asset.json";
import clip4 from "@/assets/farix-clip-4.mp4.asset.json";
import clip5 from "@/assets/farix-clip-5.mp4.asset.json";
import clip6 from "@/assets/farix-clip-6.mp4.asset.json";
import clip7 from "@/assets/farix-clip-7.mp4.asset.json";


const SITE_URL = "https://farixai.com";
const BRAND_IMAGE = `${SITE_URL}${markAsset.url}`;
const HOME_TITLE = "Farix AI — Create with AI Without Hassle";
const HOME_DESCRIPTION =
  "Farix AI gives you managed access to premium AI tools like Veo 3 and ChatGPT through one secure, invite-only platform — no accounts or setup needed.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:image", content: BRAND_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESCRIPTION },
      { name: "twitter:image", content: BRAND_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Farix AI",
          url: SITE_URL,
          logo: BRAND_IMAGE,
          description:
            "Farix AI provides managed, invite-only access to premium AI tools through a secure Chrome extension.",
          sameAs: [],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }),
      },
    ],
  }),
  component: Landing,
});

const CLIPS = [
  { hue: 230 },
  { hue: 265 },
  { hue: 290 },
  { hue: 315 },
  { hue: 340 },
  { hue: 245 },
  { hue: 200 },
];

const CLIP_SRCS = [clip1.url, clip2.url, clip3.url, clip4.url, clip5.url, clip6.url, clip7.url];




const steps = [
  {
    n: "01",
    icon: UserRound,
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
    icon: PlayCircle,
    title: "Start creating",
    body: "Open any assigned tool and start working — sessions are injected instantly.",
  },
];

const pricingPlans = [
  {
    title: "Veo Ultra",
    features: [
      "Veo 3 Lite (Unlimited)",
      "Prompts Base",
      "Nano Banana",
      "Nano Banana 2",
      "Imagen 4 Ultra",
    ],
  },
  {
    title: "Master Plan",
    popular: true,
    features: [
      "Veo 3 Lite (Unlimited)",
      "ChatGPT Premium",
      "Prompts Base (Latest Niches)",
      "Nano Banana",
      "Nano Banana 2",
      "Imagen 4 Ultra",
      "Early Access To Latest Features",
    ],
  },
  {
    title: "ChatGPT Premium",
    features: [
      "Unlimited Chats",
      "Image Generation (Limited)",
      "Image Attachment Support",
      "Prompts Base",
    ],
  },
];

const faqItems = [
  {
    question: "Is Farix AI safe to use?",
    answer:
      "Yes. Farix AI gives you managed access to premium AI accounts — like Veo — through a secure Chrome extension. You work directly inside the original, official tools; we simply handle the account setup and access on our end. The extension itself is scoped only to enable that access and doesn't collect your personal data.",
  },
  {
    question: "Do I need to create my own accounts?",
    answer:
      "No. You don't need to create or manage any accounts yourself. Once your reseller activates your access, everything is ready to use — no setup required on your end.",
  },
  {
    question: "How do I get access?",
    answer:
      "Farix AI is invite-only. You can get an account only through an authorized reseller — public registration isn't available. This keeps access controlled and every account properly managed.",
  },
  {
    question: "Can I use Farix AI on multiple devices or on mobile?",
    answer:
      "For the best experience, we recommend using your account on one device at a time. You can use Farix AI on mobile as well, as long as your mobile browser supports extensions.",
  },
  {
    question: "Will I run out of usage?",
    answer:
      "No. There's no credit system to track. You get full access until the expiry date set by your reseller — use it freely within that period.",
  },
  {
    question: "Who should I contact for support?",
    answer:
      "Please contact the reseller who provided your account — they can help with any support requests or renewals.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {faqItems.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <Reveal key={item.question} delay={i * 60}>
            <div
              className={cn(
                "rounded-2xl border bg-card transition-all duration-300",
                isOpen ? "border-primary/40 shadow-card" : "border-border shadow-soft",
              )}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left"
              >
                <span className="font-sans text-base font-semibold tracking-tight text-foreground">
                  {item.question}
                </span>
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300",
                    isOpen
                      ? "rotate-180 border-primary/20 bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground",
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden px-6">
                  <p className="pb-6 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <FarixMark className="h-6" />
          <span className="truncate font-display text-lg font-bold tracking-tight text-foreground">Farix AI</span>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {[
            { label: "Home", href: "#" },
            { label: "About", href: "#how" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
          ].map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
        <div className="relative mx-auto max-w-5xl px-5 pb-28 pt-24 text-center sm:pt-32">
          <Reveal>
            <h1 className="font-sans text-[3rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-[5.25rem]">
              <span className="text-gradient-metallic">Create with AI</span>
              <br />
              <span className="text-gradient-ocean">Without Hassle</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <div className="mt-11 flex justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-cta px-9 py-4 font-display text-base font-semibold text-primary-foreground ring-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={240}>
            <section className="-mx-8 mt-20 grid w-[calc(100%+4rem)] grid-cols-7 gap-1.5 sm:-mx-14 sm:w-[calc(100%+7rem)]">
              {CLIPS.map((c, i) => (
                <MediaCard key={i} ratio="9/16" hue={c.hue} videoSrc={CLIP_SRCS[i]} />
              ))}
            </section>
          </Reveal>
        </div>
      </section>


      {/* How it works */}
      <section id="how" className="bg-background">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              Live in three steps.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.n} delay={i * 100} className="h-full">
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-violet/60 via-brand-pink/60 to-brand-cyan/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="flex items-start justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-md ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-105">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </span>
                      <span className="font-display text-3xl font-extrabold tabular-nums tracking-tight text-muted-foreground/20">
                        {s.n}
                      </span>
                    </div>
                    <h3 className="mt-6 font-display text-lg font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-14">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-[2.5rem]">
              About <span className="text-primary">Farix AI</span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Farix AI gives teams and resellers managed access to premium AI tools
              <br className="hidden sm:block" />
              through one secure, invite-only login. No public signup, no shared passwords,
              <br className="hidden sm:block" />
              no juggling separate subscriptions. Every account is issued by an admin or reseller
              <br className="hidden sm:block" />
              who handles billing and renewals on your behalf — you just sign in and the tools are ready.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Pricing */}
      <section id="pricing" className="pricing-section">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-brand-violet/15 blur-[120px]" />
          <div className="absolute -right-32 bottom-0 h-[500px] w-[500px] rounded-full bg-brand-pink/15 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <h2 className="pricing-title font-display">Pricing</h2>
          </Reveal>

          <Reveal delay={140}>
            <div className="mx-auto -mt-[6%] grid max-w-5xl items-start gap-6 md:grid-cols-3">

              {pricingPlans.map((plan) => {
                const isPopular = plan.popular;
                return (
                  <div
                    key={plan.title}
                    className={cn(
                      "relative flex h-full flex-col overflow-hidden rounded-3xl",
                      isPopular ? "pricing-card-popular" : "pricing-card",
                    )}
                  >
                    {isPopular && <span className="pricing-popular-badge">Popular</span>}
                    <div className="flex flex-1 flex-col p-7 sm:p-8">
                      <h3 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                        {plan.title}
                      </h3>
                      <ul className="mt-6 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-cta text-cta">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <span className="text-foreground/85">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/auth"
                        className={cn(
                          "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-display font-semibold transition hover:opacity-90 active:scale-[0.98]",
                          isPopular
                            ? "bg-gradient-cta text-cta shadow-cta-glow"
                            : "pricing-btn-secondary",
                        )}
                      >
                        Contact your Reseller <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-12 text-center text-sm text-muted-foreground">
              Already have credentials?{" "}
              <Link to="/auth" className="font-medium text-brand-pink hover:underline">
                Sign in here →
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-28">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              Frequently Asked{" "}
              <span className="text-primary">Questions</span>
            </h2>
          </Reveal>
          <div className="mt-14">
            <FaqAccordion />
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <FarixMark className="h-5" />
            <span className="font-display font-semibold text-foreground">Farix AI</span>
            <span>© {new Date().getFullYear()} · All rights reserved</span>
          </span>
          <span>Invite-only access platform</span>
        </div>
      </footer>
    </div>
  );
}
