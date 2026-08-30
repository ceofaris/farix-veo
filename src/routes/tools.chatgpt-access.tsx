import { createFileRoute } from "@tanstack/react-router";
import { ToolLanding, type ToolLandingContent } from "@/components/tool-landing";

const SITE_URL = "https://farixai.com";
const PATH = "/tools/chatgpt-access";
const TITLE = "ChatGPT Access Without Setup | Farix AI";
const DESCRIPTION =
  "Get managed ChatGPT access through Farix AI. Write, research, code and plan inside the official ChatGPT interface — no signup, no subscription, no setup hassle.";

export const Route = createFileRoute("/tools/chatgpt-access")({
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
  eyebrow: "ChatGPT · Managed access",
  h1: "Use ChatGPT Without the Setup on Farix AI",
  intro:
    "Farix AI gives you managed access to ChatGPT inside the official interface. Your reseller activates the account — you just sign in and start working.",
  features: [
    {
      title: "The real ChatGPT interface",
      body: "You work directly inside chatgpt.com. Nothing is emulated or re-skinned — the extension only injects the managed session for you.",
    },
    {
      title: "Writing, research and code",
      body: "Draft scripts and ad copy, summarise long documents, plan content calendars, debug code and turn rough notes into finished output.",
    },
    {
      title: "Pairs with your video workflow",
      body: "Use ChatGPT to write and refine prompts, then generate with Veo 3 and Imagen 4 from the same Farix AI account.",
    },
  ],
  comparison: {
    farix: [
      "Access is ready the moment your reseller activates you",
      "No signup, phone verification or international card needed",
      "One secure Chrome extension handles the whole session",
      "Included alongside Veo 3 and Gemini Pro in the Master plan",
      "Support and renewals handled by your reseller",
    ],
    standalone: [
      "Account creation and phone verification before first use",
      "Monthly subscription billed in a foreign currency",
      "Payment methods that fail in many regions",
      "Separate plans for every model you want to use",
      "You handle every billing and access problem yourself",
    ],
  },
  ctaTitle: "Get ChatGPT access today",
  ctaBody:
    "Farix AI is invite-only. Sign in with the credentials from your reseller, or view the plans that include ChatGPT.",
};

function Page() {
  return <ToolLanding content={content} />;
}
