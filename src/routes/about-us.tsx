import { createFileRoute } from "@tanstack/react-router";
import { ContentPage, type ContentBlock } from "@/components/content-page";

const SITE_URL = "https://farixai.com";
const PATH = "/about-us";
const TITLE = "About Farix AI | Managed Access to Premium AI Tools";
const DESCRIPTION =
  "Learn about Farix AI — an invite-only platform that gives creators managed access to Veo 3, Gemini Pro, ChatGPT and Imagen 4 without signups, foreign cards or regional blocks.";

const blocks: ContentBlock[] = [
  {
    heading: "Who we are",
    paragraphs: [
      "Farix AI is an access platform built for creators who want to use premium AI tools without fighting the setup around them. Instead of juggling separate accounts, foreign payment methods and regional restrictions, you get one activation from an authorised reseller and a single Chrome extension that opens each tool already signed in.",
      "The platform started from a simple observation: the hardest part of using top-tier AI models in many regions is not the prompting, it is the access. Phone verification fails, international cards get declined, and each new model means another subscription. Farix AI removes that layer so the work can start immediately.",
    ],
  },
  {
    heading: "What we offer",
    bullets: [
      "Veo 3 (Lite) cinematic video generation through Google Flow, with unlimited generation on active plans.",
      "Imagen 4 and Nano Banana image generation for stills, thumbnails and concept frames.",
      "Gemini Pro for chat, research and reasoning.",
      "ChatGPT access in a testing phase with limited availability.",
      "Niche Prompts — a curated, King-managed prompt library built around real content niches.",
    ],
  },
  {
    heading: "How the model works",
    paragraphs: [
      "Farix AI operates through a three-tier structure. The platform owner maintains tool accounts, extension builds and plan definitions. Authorised resellers activate users, set plan duration and handle payments and support in their own market. Users get a dashboard, an extension download and clear expiry dates.",
      "This keeps support local and fast: your reseller knows your language, your payment method and your renewal cycle, while the platform handles infrastructure, session health and tool availability behind the scenes.",
    ],
  },
  {
    heading: "What we believe",
    bullets: [
      "Access should be simple — one activation, one extension, one expiry date.",
      "The real interface matters — you work inside the official tool, not a re-skinned clone.",
      "Privacy by restraint — we collect the minimum data needed to run accounts.",
      "Honesty about limits — testing-phase features are labelled as testing phase, not sold as unlimited.",
    ],
  },
  {
    heading: "Who uses Farix AI",
    paragraphs: [
      "Short-form video creators building faceless channels, marketing teams producing ad variations at speed, freelancers who need cinematic B-roll on a deadline, students and researchers summarising dense material, and small business owners who want professional visuals without a production budget.",
    ],
  },
  {
    heading: "Getting started",
    paragraphs: [
      "Farix AI is invite-only — there is no public signup form. An authorised reseller creates your account on the Pro or Master plan, you sign in to the dashboard, download the Farix extension, and start generating. If you do not have a reseller yet, contact us and we will point you to one.",
    ],
  },
];

export const Route = createFileRoute("/about-us")({
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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Farix AI",
          url: SITE_URL,
          description: DESCRIPTION,
          email: "support@farixai.com",
        }),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ContentPage
      eyebrow="Company · About"
      title="About Farix AI"
      intro="An invite-only platform giving creators managed access to premium AI tools — without signups, foreign cards or regional blocks."
      blocks={blocks}
    />
  );
}
