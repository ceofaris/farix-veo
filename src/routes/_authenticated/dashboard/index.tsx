import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Sparkles, Video, ImageIcon } from "lucide-react";
import { useMyTools, formatDate } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { LiveBadge, MediaCard, SectionHeader } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Home | Farix AI Workspace" },
      {
        name: "description",
        content: "Your Farix home — Veo 3 video generation and ChatGPT access in one workspace.",
      },
      { property: "og:title", content: "Home | Farix AI Workspace" },
      {
        property: "og:description",
        content: "Your Farix home — Veo 3 video generation and ChatGPT access in one workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CLIPS = [
  { hue: 265, duration: "0:08" },
  { hue: 290, duration: "0:12" },
  { hue: 315, duration: "0:06" },
  { hue: 340, duration: "0:10" },
  { hue: 245, duration: "0:09" },
];

const IMAGES = [{ hue: 275 }, { hue: 300 }, { hue: 330 }, { hue: 350 }, { hue: 255 }];

function HomePage() {
  const { profile, tools, assignments, downloadExtension, findTool } = useMyTools();
  const firstName = (profile?.full_name || profile?.email || "there").split(" ")[0];
  const veo = findTool(/veo/i);

  return (
    <div className="space-y-12">
      {/* Extension banner */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-5">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="font-semibold tracking-tight">Get the Farix Extension</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>1 Download</span>→<span>2 Log in</span>→<span>3 Start creating</span>
          </div>
        </div>
        <button
          onClick={() => downloadExtension()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          <Download className="h-4 w-4" /> Download Extension
        </button>
      </div>

      {/* Greeting + headline */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-primary/25 blur-[100px]" />
        <div className="pointer-events-none absolute right-0 -top-16 h-56 w-56 rounded-full bg-chart-4/25 blur-[110px]" />
        <div className="relative text-center">
          <p className="text-sm text-muted-foreground">Welcome back, {firstName} 👋</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Create with <span className="text-brand-gradient">AI</span> Without Hassle
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pick a tool below and start creating in seconds.
          </p>
        </div>

        {/* Featured video */}
        <div className="relative mx-auto mt-8 w-full max-w-[640px]">
          <MediaCard ratio="16/9" hue={272} label="Latest generation" duration="0:16" />
        </div>

        {/* Prompt bar */}
        <div className="mx-auto mt-4 flex w-full max-w-[640px] items-center gap-2 rounded-2xl border border-border bg-card p-2">
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Describe the video you want to create..."
            aria-label="Video prompt"
          />
          <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95">
            <Sparkles className="h-4 w-4" /> Generate
          </button>
        </div>
      </section>

      {/* Veo 3 showcase */}
      <section className="space-y-4">
        <SectionHeader
          icon={<Video className="h-4 w-4" />}
          title="Veo 3 Showcase"
          linkTo="/dashboard/veo-3"
          linkLabel="Open Veo 3"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CLIPS.map((c, i) => (
            <MediaCard key={i} ratio="9/16" hue={c.hue} duration={c.duration} />
          ))}
        </div>
      </section>

      {/* Nano Banana showcase */}
      <section className="space-y-4">
        <SectionHeader
          icon={<ImageIcon className="h-4 w-4" />}
          title="Nano Banana Showcase"
          linkTo="/dashboard/veo-3"
          linkLabel="Open Veo 3"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {IMAGES.map((c, i) => (
            <MediaCard key={i} ratio="1/1" hue={c.hue} withPlay={false} />
          ))}
        </div>
      </section>

      {/* My Tools */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">My Tools</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {tools.map((tool) => {
            const expires = assignments.get(tool.id)?.expires_at ?? profile?.expires_at ?? null;
            const to = /veo/i.test(`${tool.slug} ${tool.name}`)
              ? "/dashboard/veo-3"
              : "/dashboard/chatgpt";
            return (
              <Link
                key={tool.id}
                to={to}
                className="card-lift flex items-center gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <ToolLogo tool={tool} className="h-12 w-12" />
                <div className="min-w-0">
                  <div className="font-semibold tracking-tight">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Valid until {formatDate(expires, "—")}
                  </div>
                </div>
                <LiveBadge className="ml-auto" />
              </Link>
            );
          })}
          {tools.length === 0 && veo === null && null}
        </div>
      </section>
    </div>
  );
}
