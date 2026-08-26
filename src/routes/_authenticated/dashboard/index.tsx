import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useMyTools } from "@/hooks/use-my-tools";
import { MediaCard } from "@/components/dashboard/ui";
import { ImageTicker } from "@/components/dashboard/image-ticker";
import featuredVideo from "@/assets/farix-featured-video.mp4.asset.json";
import clip1 from "@/assets/farix-clip-1.mp4.asset.json";
import clip2 from "@/assets/farix-clip-2.mp4.asset.json";
import clip3 from "@/assets/farix-clip-3.mp4.asset.json";
import clip4 from "@/assets/farix-clip-4.mp4.asset.json";
import clip5 from "@/assets/farix-clip-5.mp4.asset.json";
import clip6 from "@/assets/farix-clip-6.mp4.asset.json";
import clip7 from "@/assets/farix-clip-7.mp4.asset.json";
import { assetUrl } from "@/lib/asset-url";


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

const CLIP_SRCS = [clip1, clip2, clip3, clip4, clip5, clip6, clip7].map(assetUrl);


function HomePage() {
  const { profile } = useMyTools();
  const firstName = (profile?.full_name || profile?.email || "there").split(" ")[0];

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
              src={assetUrl(featuredVideo)}
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

      {/* Image showcase — 2-row infinite ticker */}
      <ImageTicker />
    </div>
    </>
  );
}

