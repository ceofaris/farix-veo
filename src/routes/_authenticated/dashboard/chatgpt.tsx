import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Download, Brain, Search, Mic, Image as ImageIcon, Paperclip, Code2 } from "lucide-react";
import { useMyTools } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { FeatureCard, VideoGuide } from "@/components/dashboard/ui";
import { PlanLock } from "@/components/plan-lock";

export const Route = createFileRoute("/_authenticated/dashboard/chatgpt")({
  component: ChatGptPage,
  head: () => ({
    meta: [
      { title: "ChatGPT | Farix AI Workspace" },
      {
        name: "description",
        content: "Full ChatGPT access via Farix — GPT-5, deep research, voice mode and file uploads.",
      },
      { property: "og:title", content: "ChatGPT | Farix AI Workspace" },
      {
        property: "og:description",
        content: "Full ChatGPT access via Farix — GPT-5, deep research, voice mode and file uploads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ChatGptPage() {
  const { findTool, downloadExtension, hasChatgpt, loading } = useMyTools();
  const tool = findTool(/chat\s*-?\s*gpt/i);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!hasChatgpt) return <PlanLock feature="chatgpt" title="ChatGPT Premium" />;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <ToolLogo tool={tool ?? { name: "ChatGPT", slug: "chatgpt" }} className="h-12 w-12" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">ChatGPT</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://chatgpt.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
          >
            <ExternalLink className="h-4 w-4" /> Open ChatGPT
          </a>
          <button
            onClick={() => downloadExtension()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 font-display text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            <Download className="h-4 w-4" /> Download Extension
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What’s Included</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-4 w-4" />}
            title="GPT-5"
            description="The latest flagship model for every conversation."
          />
          <FeatureCard
            icon={<Search className="h-4 w-4" />}
            title="Deep Research"
            description="Multi-step web research compiled into full reports."
          />
          <FeatureCard
            icon={<Mic className="h-4 w-4" />}
            title="Voice Mode"
            description="Natural, real-time spoken conversations."
          />
          <FeatureCard
            icon={<ImageIcon className="h-4 w-4" />}
            title="Create Image"
            description="Generate and edit images straight from chat."
          />
          <FeatureCard
            icon={<Paperclip className="h-4 w-4" />}
            title="Add Files"
            description="Upload PDFs, sheets and docs for instant analysis."
          />
          <FeatureCard
            icon={<Code2 className="h-4 w-4" />}
            title="Advanced Coding"
            description="Write, debug and refactor code with long context."
          />
        </div>
      </section>

      <VideoGuide />
    </div>
  );
}
