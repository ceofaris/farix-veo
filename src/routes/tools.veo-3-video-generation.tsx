import { createFileRoute } from "@tanstack/react-router";
import { ToolLanding, type ToolLandingContent } from "@/components/tool-landing";

const SITE_URL = "https://farixai.com";
const PATH = "/tools/veo-3-video-generation";
const TITLE = "Veo 3 AI Video Generation Access | Farix AI";
const DESCRIPTION =
  "Get instant Veo 3 AI video generation access through Farix AI. Create cinematic text-to-video clips and hyper-realistic AI shorts — no accounts, no setup, no hassle.";

export const Route = createFileRoute("/tools/veo-3-video-generation")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}${PATH}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${PATH}` }],
  }),
  component: Page,
});

const content: ToolLandingContent = {
  eyebrow: "Veo 3 · AI video generation",
  h1: "Generate Cinematic Videos with Veo 3 on Farix AI",
  intro:
    "Veo 3 is Google's flagship text-to-video model. Farix AI gives you managed, invite-only access so you can go straight from a prompt to a finished cinematic clip.",
  features: [
    {
      title: "What Veo 3 actually is",
      body: "A state-of-the-art generative video model that turns written prompts into coherent, high-motion footage with realistic lighting, physics and camera language.",
    },
    {
      title: "Text-to-video in one step",
      body: "Describe a scene — shot type, mood, subject, movement — and Veo 3 renders it. No storyboarding tools, no stock libraries, no editing timeline required.",
    },
    {
      title: "Hyper-realistic AI shorts",
      body: "Vertical 9:16 output made for Reels, Shorts and TikTok. Consistent subjects, cinematic depth of field and natural motion that reads as real footage.",
    },
  ],
  comparison: {
    farix: [
      "Access is ready the moment your reseller activates you",
      "No credit card, subscription juggling or regional restrictions",
      "One secure Chrome extension handles the whole session",
      "Unlimited Veo 3 Lite generation until your expiry date",
      "Support and renewals handled by your reseller",
    ],
    standalone: [
      "Create and verify your own account before you can start",
      "Pay full monthly pricing even for light usage",
      "Availability blocked or limited in many countries",
      "Credit systems that run out mid-project",
      "You handle every billing and access problem yourself",
    ],
  },
  ctaTitle: "Start generating with Veo 3 today",
  ctaBody:
    "Farix AI is invite-only. Sign in with the credentials from your reseller, or view the plans that include Veo 3.",
};

function Page() {
  return <ToolLanding content={content} />;
}
