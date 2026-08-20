import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useMyTools, formatDate } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { LiveBadge, MediaCard } from "@/components/dashboard/ui";

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

const IMAGES: { hue: number; ratio: "16/9" | "9/16" | "1/1" }[] = [
  { hue: 275, ratio: "9/16" },
  { hue: 300, ratio: "16/9" },
  { hue: 330, ratio: "9/16" },
  { hue: 350, ratio: "16/9" },
  { hue: 255, ratio: "9/16" },
];

function HomePage() {
  const { profile, tools, assignments, findTool } = useMyTools();
  const firstName = (profile?.full_name || profile?.email || "there").split(" ")[0];
  const veo = findTool(/veo/i);

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Welcome back, {firstName}
      </p>

      {/* Main heading */}
      <h1 className="text-center font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        Create with <span className="text-brand-gradient">AI</span> Without Hassle
      </h1>

      {/* Featured video + prompt */}
      <section className="mx-auto w-full max-w-[560px] space-y-4">
        <MediaCard ratio="16/9" hue={272} label="Latest generation" duration="0:16" />
        <div className="flex w-full items-center gap-2 rounded-full border border-border/70 bg-card p-1.5 pl-5 shadow-soft">
          <input
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Describe the video you want to create..."
            aria-label="Video prompt"
          />
          <button className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-gradient px-5 py-3 font-display text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-95">
            <Sparkles className="h-4 w-4" /> Generate
          </button>
        </div>
      </section>

      {/* Veo 3 showcase */}
      <section className="mx-auto w-full max-w-[560px]">
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {CLIPS.map((c, i) => (
            <MediaCard key={i} ratio="9/16" hue={c.hue} duration={c.duration} />
          ))}
        </div>
      </section>

      {/* Nano Banana showcase */}
      <section className="mx-auto w-full max-w-[560px]">
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {IMAGES.map((c, i) => (
            <MediaCard key={i} ratio={c.ratio} hue={c.hue} withPlay={false} />
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
