import { createFileRoute } from "@tanstack/react-router";
import { ToolLanding, type ToolLandingContent } from "@/components/tool-landing";

const SITE_URL = "https://farixai.com";
const PATH = "/tools/imagen-4-image-generation";
const TITLE = "Imagen 4 Ultra AI Image Generation Access | Farix AI";
const DESCRIPTION =
  "Get Imagen 4 Ultra AI image generation access through Farix AI. Create photorealistic text-to-image visuals with accurate typography — no accounts, no setup, no hassle.";

export const Route = createFileRoute("/tools/imagen-4-image-generation")({
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
  eyebrow: "Imagen 4 Ultra · AI image generation",
  h1: "Create Photorealistic Images with Imagen 4 on Farix AI",
  intro:
    "Imagen 4 Ultra is Google's highest-fidelity text-to-image model. Farix AI gives you managed, invite-only access so you can generate campaign-ready visuals in seconds.",
  features: [
    {
      title: "What Imagen 4 Ultra is",
      body: "A top-tier generative image model built for photorealism — accurate materials, natural lighting and fine detail that holds up at full resolution.",
    },
    {
      title: "Text-to-image that respects the brief",
      body: "Strong prompt adherence for composition, camera, colour and style, plus far more reliable in-image text and typography than earlier models.",
    },
    {
      title: "Made for real production work",
      body: "Product shots, thumbnails, ad creative, posters and social visuals in any aspect ratio — paired with Nano Banana for fast edits and variations.",
    },
  ],
  comparison: {
    farix: [
      "Access is ready the moment your reseller activates you",
      "No account creation, verification or payment method needed",
      "One secure Chrome extension handles the whole session",
      "Imagen 4 Ultra plus Nano Banana 1 and 2 in the same plan",
      "Support and renewals handled by your reseller",
    ],
    standalone: [
      "Sign up, verify and add billing before your first render",
      "Per-image credit packs that run out at the worst moment",
      "Availability limited or unstable in many regions",
      "Separate subscriptions for image and video models",
      "You handle every billing and access problem yourself",
    ],
  },
  ctaTitle: "Start creating with Imagen 4 today",
  ctaBody:
    "Farix AI is invite-only. Sign in with the credentials from your reseller, or view the plans that include Imagen 4 Ultra.",
};

function Page() {
  return <ToolLanding content={content} />;
}
