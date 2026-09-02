import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ExternalLink,
  Sparkles,
  Search,
  Image as ImageIcon,
  Paperclip,
  Code2,
  Mic,
} from "lucide-react";
import { useMyTools } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { FeatureCard, VideoGuide } from "@/components/dashboard/ui";
import { PlanLock } from "@/components/plan-lock";

export const Route = createFileRoute("/_authenticated/dashboard/gemini")({
  component: GeminiPage,
  head: () => ({
    meta: [
      { title: "Gemini Pro | Farix AI Workspace" },
      {
        name: "description",
        content: "Google Gemini Pro access via Farix — advanced reasoning, research, images and code.",
      },
      { property: "og:title", content: "Gemini Pro | Farix AI Workspace" },
      {
        property: "og:description",
        content: "Google Gemini Pro access via Farix — advanced reasoning, research, images and code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function GeminiPage() {
  const { findTool, hasGemini, loading } = useMyTools();
  const tool = findTool(/gemini/i);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!hasGemini) return <PlanLock feature="gemini" title="Gemini Pro" />;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <ToolLogo tool={tool ?? { name: "Gemini Pro", slug: "gemini" }} className="h-12 w-12" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">Gemini Pro</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Need the extension?{" "}
              <Link to="/dashboard/extension-help" className="text-brand-cyan hover:underline">
                Extension & Help
              </Link>
            </p>
          </div>
        </div>
        <a
          href="https://gemini.google.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          <ExternalLink className="h-4 w-4" /> Open Gemini
        </a>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What’s Included</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Sparkles className="h-4 w-4" />}
            title="Gemini Pro Models"
            description="Google's most capable models for everyday work."
          />
          <FeatureCard
            icon={<Search className="h-4 w-4" />}
            title="Deep Research"
            description="Multi-step research compiled into structured reports."
          />
          <FeatureCard
            icon={<ImageIcon className="h-4 w-4" />}
            title="Image Generation"
            description="Create and edit images directly inside the chat."
          />
          <FeatureCard
            icon={<Paperclip className="h-4 w-4" />}
            title="File Analysis"
            description="Upload PDFs, sheets and docs for instant answers."
          />
          <FeatureCard
            icon={<Code2 className="h-4 w-4" />}
            title="Coding Support"
            description="Write, debug and explain code with long context."
          />
          <FeatureCard
            icon={<Mic className="h-4 w-4" />}
            title="Voice & Live"
            description="Talk to Gemini in natural, real-time conversation."
          />
        </div>
      </section>
    </div>
  );
}
