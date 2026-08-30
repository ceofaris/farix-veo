import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";

const TOOL_LINKS = [
  { label: "Veo 3 Video Generation", to: "/tools/veo-3-video-generation" },
  { label: "Imagen 4 Image Generation", to: "/tools/imagen-4-image-generation" },
  { label: "ChatGPT Access", to: "/tools/chatgpt-access" },
];
import { FarixMark } from "@/components/farix-logo";
import { Reveal } from "@/components/reveal";

export type ToolLandingContent = {
  eyebrow: string;
  h1: string;
  intro: string;
  features: { title: string; body: string }[];
  comparison: { farix: string[]; standalone: string[] };
  ctaTitle: string;
  ctaBody: string;
};

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <FarixMark className="h-5 sm:h-6" />
          <span className="truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            Farix AI
          </span>
        </Link>
        <div className="ml-auto hidden flex-1 items-center justify-center gap-1 md:flex">
          <a href="/#" className="rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Home</a>
          <a href="/#how" className="rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">About</a>
          <a href="/#pricing" className="rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Pricing</a>
          <a href="/#faq" className="rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">FAQ</a>
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Tools
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="w-64 rounded-2xl border border-border bg-background p-1.5 shadow-card">
                {TOOL_LINKS.map((t) => (
                  <Link
                    key={t.to}
                    to={t.to}
                    className="block rounded-xl px-4 py-2.5 font-sans text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
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
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-cta px-4 py-2 font-display text-xs font-semibold text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98] sm:px-5 sm:text-sm"
          >
          Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-accent md:hidden"
          >
            {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col">
            <a href="/#" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent">Home</a>
            <a href="/#how" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent">About</a>
            <a href="/#pricing" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent">Pricing</a>
            <a href="/#faq" onClick={() => setMenuOpen(false)} className="rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent">FAQ</a>
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent"
            >
              Tools
              <ChevronDown className={cn("h-4 w-4 transition-transform", toolsOpen && "rotate-180")} />
            </button>
            {toolsOpen && (
              <div className="mb-1 ml-4 flex flex-col border-l border-border">
                {TOOL_LINKS.map((t) => (
                  <Link
                    key={t.to}
                    to={t.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-2.5 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function ToolLanding({ content }: { content: ToolLandingContent }) {
  // Marketing pages are light-theme only, matching the homepage.
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
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div className="relative mx-auto max-w-4xl px-5 pb-16 pt-14 text-center sm:pb-24 sm:pt-24">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 font-sans text-xs font-medium tracking-wide text-muted-foreground">
              {content.eyebrow}
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 font-sans text-[2.15rem] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[3.75rem] sm:leading-[1.05]">
              <span className="text-gradient-metallic">{content.h1}</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {content.intro}
            </p>
          </Reveal>
          <Reveal delay={260}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-cta px-8 py-3.5 font-display text-base font-semibold text-primary-foreground ring-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/"
                hash="pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 font-display text-base font-semibold text-foreground transition hover:bg-accent"
              >
                View Pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              Built for serious creators.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {content.features.map((f, i) => (
              <Reveal key={f.title} delay={i * 100} className="h-full">
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-md">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-violet/60 via-brand-pink/60 to-brand-cyan/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <h3 className="font-display text-lg font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <Reveal>
            <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              Farix AI vs. <span className="text-primary">standalone accounts</span>
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-primary/25 bg-card p-7 shadow-card">
                <h3 className="font-display text-lg font-semibold tracking-tight">With Farix AI</h3>
                <ul className="mt-5 space-y-3">
                  {content.comparison.farix.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-cta text-cta">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/85">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-soft">
                <h3 className="font-display text-lg font-semibold tracking-tight text-muted-foreground">
                  Setting it up yourself
                </h3>
                <ul className="mt-5 space-y-3">
                  {content.comparison.standalone.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                        <X className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
              {content.ctaTitle}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {content.ctaBody}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-cta px-8 py-3.5 font-display text-base font-semibold text-primary-foreground ring-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                Get Started <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/"
                hash="pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 font-display text-base font-semibold text-foreground transition hover:bg-accent"
              >
                See plans
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link to="/tools/veo-3-video-generation" className="hover:text-foreground">
              Veo 3 video generation
            </Link>
            <Link to="/tools/imagen-4-image-generation" className="hover:text-foreground">
              Imagen 4 image generation
            </Link>
            <Link to="/tools/chatgpt-access" className="hover:text-foreground">
              ChatGPT access
            </Link>
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
