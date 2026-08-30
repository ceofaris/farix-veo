import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";

export type ContentBlock = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function ContentPage({
  eyebrow,
  title,
  intro,
  updated,
  blocks,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  blocks: ContentBlock[];
  children?: React.ReactNode;
}) {
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

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-14 text-center sm:pt-20">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 font-sans text-xs font-medium tracking-wide text-muted-foreground">
              {eyebrow}
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 font-sans text-[2.1rem] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[3.25rem]">
              <span className="text-gradient-metallic">{title}</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{intro}</p>
            {updated && <p className="mt-4 text-xs text-muted-foreground">Last updated: {updated}</p>}
          </Reveal>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-5 pb-16">
          <div className="space-y-8">
            {blocks.map((b, i) => (
              <Reveal key={b.heading} delay={i * 40}>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
                  <h2 className="font-display text-xl font-bold tracking-[-0.02em] sm:text-2xl">{b.heading}</h2>
                  {b.paragraphs?.map((p) => (
                    <p key={p} className="mt-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                  {b.bullets && (
                    <ul className="mt-4 space-y-2">
                      {b.bullets.map((li) => (
                        <li key={li} className="flex gap-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {children}

          <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center shadow-card">
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em]">Ready to start with Farix AI?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Access is invite-only. Sign in with the credentials from your reseller, or view the plans first.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-cta px-7 py-3 font-display text-sm font-semibold text-primary-foreground ring-glow transition hover:opacity-90 active:scale-[0.98]"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                hash="pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 font-display text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
