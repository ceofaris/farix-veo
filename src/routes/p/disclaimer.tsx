import { createFileRoute } from "@tanstack/react-router";
import { ContentPage, type ContentBlock } from "@/components/content-page";

const SITE_URL = "https://farixai.com";
const PATH = "/p/disclaimer";
const TITLE = "Disclaimer | Farix AI";
const DESCRIPTION =
  "Important disclaimers for Farix AI: independent access platform, no affiliation with Google or OpenAI, AI output accuracy, availability limits and user responsibility.";

const blocks: ContentBlock[] = [
  {
    heading: "1. Independent access platform",
    paragraphs: [
      "Farix AI is an independent platform that provides managed access to third-party AI tools. We are not affiliated with, endorsed by, sponsored by or officially connected to Google, Google DeepMind, OpenAI or any other tool provider. Product names such as Veo, Flow, Gemini, Imagen and ChatGPT are trademarks of their respective owners and are used only to describe which tools are reachable through the platform.",
    ],
  },
  {
    heading: "2. No guarantee of AI accuracy",
    paragraphs: [
      "AI models can produce inaccurate, outdated, biased or entirely fabricated output. Text, code, images and video generated through the tools should be reviewed by a human before publication or commercial use. Farix AI does not verify generated content and accepts no responsibility for decisions made on the basis of it.",
    ],
  },
  {
    heading: "3. Not professional advice",
    paragraphs: [
      "Nothing produced through the platform constitutes legal, medical, financial, tax or other professional advice. Always consult a qualified professional before acting on AI-generated information.",
    ],
  },
  {
    heading: "4. Availability and feature changes",
    bullets: [
      "Providers can change models, interfaces, quotas and regional availability at any time.",
      "Features listed as testing phase or coming soon may be limited, delayed or withdrawn.",
      "Temporary interruptions can occur during provider outages or maintenance.",
    ],
  },
  {
    heading: "5. Shared managed sessions",
    paragraphs: [
      "Managed sessions are shared infrastructure and are not private personal accounts. Do not enter passwords, financial details, identity documents or confidential client information. Users are responsible for keeping sensitive data out of managed tools.",
    ],
  },
  {
    heading: "6. User responsibility",
    paragraphs: [
      "You are solely responsible for how you use the tools and for complying with each provider's usage policies and with the laws of your country. Generating illegal, deceptive, harmful or infringing content is strictly prohibited and may result in immediate termination.",
    ],
  },
  {
    heading: "7. External links",
    paragraphs: [
      "This site links to external websites and tool interfaces. We do not control those sites and are not responsible for their content, policies or practices.",
    ],
  },
  {
    heading: "8. Limitation",
    paragraphs: [
      "To the maximum extent permitted by law, Farix AI disclaims all warranties, express or implied, relating to the platform and to any content generated through it. Questions about this disclaimer can be sent to support@farixai.com.",
    ],
  },
];

export const Route = createFileRoute("/p/disclaimer")({
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

function Page() {
  return (
    <ContentPage
      eyebrow="Legal · Disclaimer"
      title="Disclaimer"
      intro="What Farix AI is, what it is not, and the limits of AI-generated output."
      updated="August 2026"
      blocks={blocks}
    />
  );
}
