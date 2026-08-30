import { createFileRoute } from "@tanstack/react-router";
import { ToolLanding, type ToolLandingContent } from "@/components/tool-landing";

const SITE_URL = "https://farixai.com";
const PATH = "/tools/chatgpt-access";
const TITLE = "ChatGPT Access Without Setup | Farix AI";
const DESCRIPTION =
  "Get managed ChatGPT access through Farix AI. Write, research, code and plan inside the official ChatGPT interface — no signup, no subscription, no setup hassle.";

const content: ToolLandingContent = {
  eyebrow: "ChatGPT · Managed access",
  h1: "Use ChatGPT Without the Setup on Farix AI",
  intro:
    "Farix AI gives you managed access to ChatGPT inside the official interface. Your reseller activates the account — you just sign in, install one extension and start working.",
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
  sections: [
    {
      heading: "What managed ChatGPT access means",
      paragraphs: [
        "Managed access means the account, the billing and the session are handled for you. You do not create a ChatGPT account, you do not pass phone verification, and you do not need an international card — your reseller activates your Farix AI plan and the Farix Chrome extension injects a working session into the official chatgpt.com interface.",
        "Everything you see is the genuine product. The extension does not proxy your messages through a third-party clone or re-skin the UI; it simply supplies the session so the site opens signed in. Conversations, formatting, file handling and model behaviour are exactly what you would get from a normal account.",
        "For privacy and account safety, the managed session runs in a locked-down state: profile, billing and settings areas are disabled, and the account name is masked. Chat itself — new conversations, the composer and responses — works normally.",
      ],
    },
    {
      heading: "What people actually use it for",
      paragraphs: [
        "ChatGPT is most valuable when it sits inside an existing workflow rather than being used as a novelty. For Farix AI users, the most common pattern is content production: research a topic, outline the piece, draft the script, then feed the visual descriptions into Veo 3 or Imagen 4 from the same account.",
        "It is equally strong on the operational side — turning meeting notes into action lists, rewriting product descriptions at scale, translating and localising copy, explaining unfamiliar code, and drafting client emails that would otherwise eat an hour a day.",
      ],
      bullets: [
        "Scriptwriting for short-form video, with hooks, beats and calls to action.",
        "Prompt engineering — expanding a one-line idea into a full cinematic shot description.",
        "Long-document summarisation, comparison and extraction.",
        "Code explanation, debugging help and boilerplate generation.",
        "Ad copy, product descriptions, email sequences and landing page drafts.",
        "Research briefs, outlines and content calendars.",
      ],
    },
    {
      heading: "Why it is bundled with Veo 3 and Gemini Pro",
      paragraphs: [
        "AI work is rarely single-tool. A typical Farix AI session moves between a language model for ideas and copy, a chat model for research, and a generation model for visuals. Buying those separately means three subscriptions, three billing relationships and three sets of regional restrictions.",
        "The Master plan collapses that into one activation: Veo 3 for cinematic video, Gemini Pro for chat and reasoning, and ChatGPT for writing and code — all reachable through the same extension and the same expiry date. ChatGPT on Farix AI is currently in a testing phase with limited access, so treat it as a strong complement to the video and image tools rather than the core of the plan.",
      ],
    },
  ],
  steps: [
    {
      title: "Get activated",
      body: "Your reseller creates your Farix AI account on the Master plan and sets an expiry date. Access is invite-only — there is no public signup.",
    },
    {
      title: "Install the extension",
      body: "Download the Farix Chrome extension from your dashboard and install it. One click injects a managed ChatGPT session.",
    },
    {
      title: "Open and start chatting",
      body: "chatgpt.com opens already signed in. Write, research, plan or code exactly as you would with your own account.",
    },
  ],
  useCases: [
    {
      title: "Content creators",
      body: "Turn a rough idea into a full script, hook set and description without staring at a blank page.",
    },
    {
      title: "Marketers",
      body: "Draft ad variations, email sequences and landing copy, then iterate against performance feedback.",
    },
    {
      title: "Students and researchers",
      body: "Summarise dense material, compare sources and build structured study notes quickly.",
    },
    {
      title: "Developers",
      body: "Explain unfamiliar code, debug errors and generate boilerplate without leaving the browser.",
    },
    {
      title: "Small business owners",
      body: "Handle customer replies, product descriptions and social captions without hiring a copywriter.",
    },
    {
      title: "Prompt engineers",
      body: "Expand short concepts into detailed cinematic prompts for Veo 3 and Imagen 4.",
    },
  ],
  specs: [
    { label: "Interface", value: "Official chatgpt.com — not a clone or re-skin" },
    { label: "Access status", value: "Testing phase, limited access" },
    { label: "Included in", value: "Master plan (alongside Veo 3 and Gemini Pro)" },
    { label: "Account needed", value: "None — managed session, no signup or phone verification" },
    { label: "Session security", value: "Profile, billing and settings locked; account name masked" },
    { label: "Access method", value: "Farix Chrome extension with managed session injection" },
    { label: "Devices", value: "Desktop Chrome — setup guides available for PC and mobile" },
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
  faqs: [
    {
      q: "Is this the real ChatGPT?",
      a: "Yes. You work inside the official chatgpt.com interface. The Farix extension only injects a managed session so the site opens signed in — nothing is emulated, proxied through a clone or re-skinned.",
    },
    {
      q: "Do I need to create a ChatGPT account?",
      a: "No. There is no signup, no phone verification and no payment method required from you. Your reseller activates your Farix AI plan and the extension handles the session.",
    },
    {
      q: "Which Farix AI plan includes ChatGPT?",
      a: "ChatGPT is included in the Master plan, together with Veo 3 Lite unlimited generation and Gemini Pro chat. The Pro plan covers Veo 3 and Niche Prompts only.",
    },
    {
      q: "Why can't I open settings or see the account name?",
      a: "The managed session is intentionally locked down for privacy and account safety. Profile, billing and settings areas are disabled and the account name is masked as Farix. Chat, new conversations and the composer work normally.",
    },
    {
      q: "Are my conversations private to me?",
      a: "Treat the managed session as shared infrastructure rather than a private personal account. Avoid entering passwords, financial details or confidential client data in your chats.",
    },
    {
      q: "Is there a message limit?",
      a: "ChatGPT on Farix AI is currently in a testing phase with limited access, so availability can vary. Veo 3 and the image tools remain the core of the plan.",
    },
    {
      q: "Does it work on mobile?",
      a: "The managed session is injected by a Chrome extension, so desktop Chrome is the supported path. Your dashboard includes video guides for both PC/laptop and mobile setups.",
    },
    {
      q: "How do I get an account?",
      a: "Farix AI is invite-only. An authorised reseller creates your account and provides credentials — there is no public self-signup form.",
    },
  ],
  ctaTitle: "Get ChatGPT access today",
  ctaBody:
    "Farix AI is invite-only. Sign in with the credentials from your reseller, or view the plans that include ChatGPT.",
};

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
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (content.faqs ?? []).map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "ChatGPT Access", item: `${SITE_URL}${PATH}` },
          ],
        }),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return <ToolLanding content={content} />;
}
