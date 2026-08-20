import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, AudioLines, Banana, Download } from "lucide-react";
import { useMyTools, formatDate } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { FeatureCard, HeroBanner, LiveBadge, VideoGuide } from "@/components/dashboard/ui";

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
  const { findTool, expiryFor, downloadExtension } = useMyTools();
  const tool = findTool(/veo/i);
  const expires = expiryFor(/veo/i);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-4">
        <ToolLogo tool={tool ?? { name: "Veo 3", slug: "veo-3" }} className="h-12 w-12" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Veo 3</h1>
            <LiveBadge />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Google Veo 3 video generation via Farix — Unlimited access
          </p>
        </div>
        <button
          onClick={() => downloadExtension(tool?.id)}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          <Download className="h-4 w-4" /> Download Veo 3 Extension
        </button>
      </header>

      <HeroBanner
        category="Video Generation"
        headline="Direct cinematic video from a single prompt"
        description="Write one prompt and get a fully rendered scene with sound, ready to share."
        cta="Try Now on Veo 3 →"
        href="https://labs.google/fx/tools/flow"
        hue={268}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What's Included</h2>
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

      <p className="text-sm text-muted-foreground">
        Access valid until {formatDate(expires, "29/08/2026")}
      </p>
    </div>
  );
}
