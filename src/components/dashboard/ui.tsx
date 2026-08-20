import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Play, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
    </span>
  );
}

export function SectionHeader({
  icon,
  title,
  linkTo,
  linkLabel,
}: {
  icon: ReactNode;
  title: string;
  linkTo?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
        {icon}
      </span>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {linkTo && (
        <Link
          to={linkTo}
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function MediaCard({
  ratio,
  hue,
  duration,
  label,
  withPlay = true,
  className,
}: {
  ratio: "16/9" | "9/16" | "1/1";
  hue: number;
  duration?: string;
  label?: string;
  withPlay?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card transition-all duration-200 hover:border-border hover:shadow-card",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 30% 15%, hsl(${hue} 70% 30% / 0.85), transparent 70%), linear-gradient(160deg, hsl(${hue} 55% 16%), hsl(${(hue + 40) % 360} 45% 8%))`,
        }}
      />
      {withPlay && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-sm transition-transform group-hover:scale-110">
            <Play className="h-4 w-4 translate-x-[1px] fill-current text-foreground" />
          </span>
        </div>
      )}
      {duration && (
        <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 font-display text-[10px] font-medium tracking-tight text-white backdrop-blur-sm">
          {duration}
        </span>
      )}
      {label && (
        <span className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-0.5 font-display text-[11px] font-medium tracking-tight text-white backdrop-blur-sm">
          {label}
        </span>
      )}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card-lift rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
          {icon}
        </span>
        <div className="font-semibold tracking-tight">{title}</div>
        <LiveBadge className="ml-auto" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export function HeroBanner({
  category,
  headline,
  description,
  cta,
  href,
  hue,
}: {
  category: string;
  headline: string;
  description: string;
  cta: string;
  href: string;
  hue: number;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border p-6 sm:p-8"
      style={{
        minHeight: 300,
        background: `radial-gradient(90% 120% at 85% 0%, hsl(${hue} 75% 32% / 0.8), transparent 65%), linear-gradient(180deg, hsl(${hue} 40% 12%), hsl(280 45% 6%))`,
      }}
    >
      <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur-sm">
        {category}
      </span>
      <div className="mt-28 max-w-xl">
        <h2 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {headline}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}

export function VideoGuide() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Video Guide</h2>
        <p className="text-sm text-muted-foreground">
          Watch how to set up and use this tool on your device.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Replace each MediaCard with a real YouTube embed, e.g.
            <iframe className="w-full aspect-video rounded-2xl" src="https://www.youtube.com/embed/VIDEO_ID" allowFullScreen /> */}
        <MediaCard ratio="16/9" hue={265} label="How to use on Laptop" duration="Laptop" />
        <MediaCard ratio="16/9" hue={315} label="How to use on Mobile" duration="Mobile" />
      </div>
    </section>
  );
}
