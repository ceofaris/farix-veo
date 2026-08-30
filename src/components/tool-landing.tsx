import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export type ToolLandingContent = {
  eyebrow: string;
  h1: string;
  intro: string;
  features: { title: string; body: string }[];
  comparison: { farix: string[]; standalone: string[] };
  ctaTitle: string;
  ctaBody: string;
  /** Long-form editorial sections rendered between features and comparison. */
  sections?: { heading: string; paragraphs: string[]; bullets?: string[] }[];
  /** "How it works" ordered steps. */
  steps?: { title: string; body: string }[];
  /** Who the tool is for. */
  useCases?: { title: string; body: string }[];
  /** Spec / capability table rows. */
  specs?: { label: string; value: string }[];
  /** FAQ entries — also emitted as FAQPage JSON-LD from the route. */
  faqs?: { q: string; a: string }[];
};

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
      <SiteHeader />

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

      {/* Long-form editorial sections */}
      {content.sections?.length ? (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <div className="space-y-14">
              {content.sections.map((s) => (
                <Reveal key={s.heading}>
                  <article>
                    <h2 className="font-display text-2xl font-bold tracking-[-0.03em] sm:text-[2rem]">
                      {s.heading}
                    </h2>
                    <div className="mt-4 space-y-4">
                      {s.paragraphs.map((p) => (
                        <p key={p} className="text-[0.975rem] leading-[1.85] text-muted-foreground">
                          {p}
                        </p>
                      ))}
                    </div>
                    {s.bullets?.length ? (
                      <ul className="mt-5 space-y-2.5">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-3 text-[0.95rem] leading-relaxed">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-cta" />
                            <span className="text-foreground/80">{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* How it works */}
      {content.steps?.length ? (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <Reveal>
              <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                How it works
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {content.steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 90} className="h-full">
                  <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-7 shadow-sm">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-cta font-display text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Use cases */}
      {content.useCases?.length ? (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <Reveal>
              <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                Who it's for
              </h2>
            </Reveal>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.useCases.map((u, i) => (
                <Reveal key={u.title} delay={i * 70} className="h-full">
                  <div className="h-full rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-colors hover:border-primary/25">
                    <h3 className="font-display text-base font-semibold tracking-tight">{u.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Specs */}
      {content.specs?.length ? (
        <section className="border-t border-border bg-background">
          <div className="mx-auto max-w-3xl px-5 py-14">
            <Reveal>
              <h2 className="font-display text-2xl font-bold tracking-[-0.03em] sm:text-[2rem]">
                At a glance
              </h2>
              <dl className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
                {content.specs.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:gap-6",
                      i > 0 && "border-t border-border",
                    )}
                  >
                    <dt className="font-display text-sm font-semibold text-foreground sm:w-56 sm:shrink-0">
                      {row.label}
                    </dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>
      ) : null}

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

      {/* FAQ */}
      {content.faqs?.length ? (
        <section id="faq" className="bg-background">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <Reveal>
              <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-[2.5rem]">
                Frequently asked questions
              </h2>
            </Reveal>
            <div className="mt-9 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {content.faqs.map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[1.02rem] font-semibold tracking-tight text-foreground">
                    {f.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-[1.8] text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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

      <SiteFooter />
    </div>
  );
}
