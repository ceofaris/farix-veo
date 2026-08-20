import { createFileRoute } from "@tanstack/react-router";
import { Brain, Search, Mic, Image as ImageIcon, Paperclip, Code2 } from "lucide-react";
import { useMyTools, formatDate } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { FeatureCard, HeroBanner, LiveBadge, VideoGuide } from "@/components/dashboard/ui";

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
  const { findTool, expiryFor } = useMyTools();
  const tool = findTool(/chat\s*-?\s*gpt/i);
  const expires = expiryFor(/chat\s*-?\s*gpt/i);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center gap-4">
        <ToolLogo tool={tool ?? { name: "ChatGPT", slug: "chatgpt" }} className="h-12 w-12" />
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">ChatGPT</h1>
            <LiveBadge />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Full ChatGPT access via Farix — Unlimited access
          </p>
        </div>
      </header>

      <HeroBanner
        category="Chat Model"
        headline="GPT-5 with deep research, built in"
        description="Thinking mode, image creation, file uploads and voice — the full ChatGPT experience, included with your Farix access."
        cta="Try Now on ChatGPT →"
        href="https://chatgpt.com"
        hue={168}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">What's Included</h2>
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

      <p className="text-sm text-muted-foreground">
        Access valid until {formatDate(expires, "17/09/2026")}
      </p>
    </div>
  );
}
