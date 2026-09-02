import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Download, Clapperboard, AudioLines, Banana } from "lucide-react";
import { useMyTools } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { FeatureCard, VideoGuide } from "@/components/dashboard/ui";
import { PlanLock } from "@/components/plan-lock";

export const Route = createFileRoute("/_authenticated/dashboard/veo-3")({
  component: VeoPage,
  head: () => ({
    meta: [
      { title: "Veo 3 | Farix AI Workspace" },
      {
        name: "description",
        content: "Google Veo 3 cinematic video generation with native audio, included with Farix.",
      },
      { property: "og:title", content: "Veo 3 | Farix AI Workspace" },
      {
        property: "og:description",
        content: "Google Veo 3 cinematic video generation with native audio, included with Farix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function VeoPage() {
  const { findTool, downloadExtension, hasVeo, loading } = useMyTools();
  const tool = findTool(/veo/i);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!hasVeo) return <PlanLock feature="veo" title="Veo 3" />;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <ToolLogo tool={tool ?? { name: "Veo 3", slug: "veo-3" }} className="h-12 w-12" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">Veo 3</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://labs.google/fx/tools/flow"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
          >
            <ExternalLink className="h-4 w-4" /> Open Veo Flow
          </a>
          <button
            onClick={() => downloadExtension(tool?.id)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 font-display text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-4 w-4" /> Download Extension
          </button>
        </div>
      </header>
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Remaining Credits</div>
            <div className="mt-1 font-display text-4xl font-semibold tracking-tight">
              {credits.isPending ? "…" : formatCredits(credits.data)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {VEO_CREDIT_COST} credits are deducted per successfully generated Veo video. Failed or
              cancelled generations cost nothing.
            </div>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Coins className="h-6 w-6" />
          </div>
        </div>
        {!credits.isPending && (credits.data ?? 0) < VEO_CREDIT_COST && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Insufficient credits — you need at least {VEO_CREDIT_COST} credits to generate a video.
            Contact your reseller to top up.
          </div>
        )}
      </section>


      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What’s Included</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Clapperboard className="h-4 w-4" />}
            title="Veo 3.1 Model"
            description="Latest cinematic generation model, running now."
          />
          <FeatureCard
            icon={<AudioLines className="h-4 w-4" />}
            title="Native Audio"
            description="Sound generated in sync with the video, automatically."
          />
          <FeatureCard
            icon={<Banana className="h-4 w-4" />}
            title="Nano Banana"
            description="Fast, high-quality companion image generation."
          />
        </div>
      </section>

      <VideoGuide />
    </div>
  );
}
