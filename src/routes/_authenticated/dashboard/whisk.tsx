import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Sparkles, Image as ImageIcon, Wand2, Layers, Palette, Zap } from "lucide-react";
import { useMyTools } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { FeatureCard } from "@/components/dashboard/ui";
import { PlanLock } from "@/components/plan-lock";

/** Whisk runs on the same managed Flow/Veo accounts — only the URL differs. */
const WHISK_URL =
  "https://flow.google.com/about";

export const Route = createFileRoute("/_authenticated/dashboard/whisk")({
  component: WhiskPage,
  head: () => ({
    meta: [
      { title: "Whisk | Farix AI Workspace" },
      {
        name: "description",
        content: "Google Whisk access via Farix — remix images into new visuals with one managed session.",
      },
      { property: "og:title", content: "Whisk | Farix AI Workspace" },
      {
        property: "og:description",
        content: "Google Whisk access via Farix — remix images into new visuals with one managed session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function WhiskPage() {
  const { findTool, hasWhisk, loading } = useMyTools();
  // Whisk shares the Veo 3 extension build and cookie pool.
  const tool = findTool(/veo|flow/i);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!hasWhisk) return <PlanLock feature="whisk" title="Whisk" />;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <ToolLogo tool={tool ?? { name: "Whisk", slug: "veo-3" }} className="h-12 w-12" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">Whisk</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Uses the same managed session as Veo 3 — inject once from the extension.{" "}
              <Link to="/dashboard/extension-help" className="text-brand-cyan hover:underline">
                Extension & Help
              </Link>
            </p>
          </div>
        </div>
        <a
          href={WHISK_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          <ExternalLink className="h-4 w-4" /> Open Whisk
        </a>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What’s Included</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<ImageIcon className="h-4 w-4" />}
            title="Image Remixing"
            description="Blend subject, scene and style images into one new visual."
          />
          <FeatureCard
            icon={<Wand2 className="h-4 w-4" />}
            title="Prompt Refining"
            description="Fine-tune results with short prompts on top of your images."
          />
          <FeatureCard
            icon={<Palette className="h-4 w-4" />}
            title="Style Transfer"
            description="Apply any look or art direction to your own references."
          />
          <FeatureCard
            icon={<Layers className="h-4 w-4" />}
            title="Multi-Reference"
            description="Combine several inputs for consistent characters and scenes."
          />
          <FeatureCard
            icon={<Sparkles className="h-4 w-4" />}
            title="Google Labs Quality"
            description="Powered by the latest Imagen models inside Google Labs."
          />
          <FeatureCard
            icon={<Zap className="h-4 w-4" />}
            title="One-Click Session"
            description="The Farix extension injects your Flow session and opens Whisk."
          />
        </div>
      </section>
    </div>
  );
}
