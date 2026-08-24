import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useMyTools, formatDate } from "@/hooks/use-my-tools";
import { ToolLogo } from "@/components/tool-logo";
import { LiveBadge, MediaCard } from "@/components/dashboard/ui";
import featuredVideo from "@/assets/farix-featured-video.mp4.asset.json";
import clip1 from "@/assets/farix-clip-1.mp4.asset.json";
import clip2 from "@/assets/farix-clip-2.mp4.asset.json";
import clip3 from "@/assets/farix-clip-3.mp4.asset.json";
import clip4 from "@/assets/farix-clip-4.mp4.asset.json";
import clip5 from "@/assets/farix-clip-5.mp4.asset.json";
import clip6 from "@/assets/farix-clip-6.mp4.asset.json";
import clip7 from "@/assets/farix-clip-7.mp4.asset.json";


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
  { hue: 230 },
  { hue: 265 },
  { hue: 290 },
  { hue: 315 },
  { hue: 340 },
  { hue: 245 },
  { hue: 200 },
];

const CLIP_SRCS = [clip1.url, clip2.url, clip3.url, clip4.url, clip5.url, clip6.url, clip7.url];


const IMAGES: { hue: number; ratio: "16/9" | "9/16" | "1/1" }[] = [
  { hue: 275, ratio: "9/16" },
  { hue: 300, ratio: "16/9" },
  { hue: 330, ratio: "9/16" },
  { hue: 350, ratio: "16/9" },
  { hue: 255, ratio: "9/16" },
];

function HomePage() {
  const { profile, tools, expiresAt, findTool } = useMyTools();
  const firstName = (profile?.full_name || profile?.email || "there").split(" ")[0];
  const veo = findTool(/veo/i);

  return (
    <>
      <p className="-mt-4 -ml-5 mb-3 text-sm font-medium text-foreground sm:-mt-5 sm:-ml-8">
        Welcome back, <span className="text-brand-gradient">{firstName}</span> 👋
      </p>
      <div className="space-y-6">
        {/* Greeting + headline */}
        <section className="space-y-5">
        <h1 className="text-center font-sans text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Create with <span className="text-brand-gradient">AI</span> Without Hassle
        </h1>

        {/* Featured video */}
        <div className="mx-auto mt-6 w-full max-w-[620px]">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
            <video
              autoPlay
              className="block aspect-video w-full object-cover"
              controls={false}
              disablePictureInPicture
              loop
              muted
              playsInline
              preload="auto"
              src={featuredVideo.url}
            />
          </div>
        </div>

        {/* Prompt bar */}
        <div className="mx-auto flex w-full max-w-[560px] items-center gap-2 rounded-full border border-border/70 bg-card p-1.5 pl-5 shadow-soft">
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
      <section className="-mx-5 grid w-[calc(100%+2.5rem)] grid-cols-7 gap-1.5 sm:-mx-8 sm:w-[calc(100%+4rem)]">
        {CLIPS.map((c, i) => (
          <MediaCard key={i} ratio="9/16" hue={c.hue} videoSrc={CLIP_SRCS[i]} />
        ))}
      </section>

      {/* Nano Banana showcase — mixed aspect ratios, equal height row */}
      <section className="flex flex-wrap justify-center gap-4">
        {IMAGES.map((c, i) => (
          <MediaCard
            key={i}
            ratio={c.ratio}
            hue={c.hue}
            withPlay={false}
            className="h-[180px] sm:h-[210px]"
          />
        ))}
      </section>

      {/* My Tools */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">My Tools</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {tools.map((tool) => {
            const expires = expiresAt;
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
