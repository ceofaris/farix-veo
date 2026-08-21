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

const SHOWCASE: {
  hue: number;
  ratio: "16/9" | "9/16";
  duration: string;
  className: string;
}[] = [
  { hue: 265, ratio: "9/16", duration: "0:08", className: "lg:col-span-2 lg:row-span-2" },
  { hue: 290, ratio: "16/9", duration: "0:12", className: "lg:col-span-4" },
  { hue: 315, ratio: "16/9", duration: "0:06", className: "lg:col-span-4" },
  { hue: 340, ratio: "9/16", duration: "0:10", className: "lg:col-span-2 lg:row-span-2" },
  { hue: 245, ratio: "16/9", duration: "0:09", className: "lg:col-span-4" },
  { hue: 330, ratio: "16/9", duration: "0:11", className: "lg:col-span-4" },
];

function HomePage() {
  const { profile, tools, assignments, findTool } = useMyTools();
  const firstName = (profile?.full_name || profile?.email || "there").split(" ")[0];
  const veo = findTool(/veo/i);

  return (
    <>
      <p className="-mt-3 text-xs font-medium text-foreground sm:-mt-4 sm:text-sm">
        Welcome back, <span className="text-brand-gradient">{firstName}</span> 👋
      </p>
      <div className="mt-3 space-y-5 sm:mt-4">
        {/* Greeting + headline */}
        <section className="space-y-3.5 sm:space-y-4">
          <h1 className="text-center font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl lg:font-extrabold">
            Create with <span className="text-brand-gradient">AI</span> Without Hassle
          </h1>

          {/* Featured video */}
          <div className="mx-auto w-full max-w-[680px]">
            <MediaCard ratio="16/9" hue={272} label="Latest generation" duration="0:16" />
          </div>

          {/* Prompt bar */}
          <div className="mx-auto flex w-full max-w-[680px] items-center gap-2 rounded-full border border-border/70 bg-card p-1.5 pl-5 shadow-soft">
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

        {/* Mixed showcase collage */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-12 lg:auto-rows-[150px]">
          {SHOWCASE.map((item) => (
            <MediaCard
              key={`${item.hue}-${item.duration}`}
              ratio={item.ratio}
              hue={item.hue}
              duration={item.duration}
              withPlay={false}
              className={`${item.className} w-full lg:h-full`}
            />
          ))}
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
    </>
  );
}
