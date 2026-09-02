import { createFileRoute } from "@tanstack/react-router";
import { ToolLanding, type ToolLandingContent } from "@/components/tool-landing";

const SITE_URL = "https://farixai.com";
const PATH = "/tools/veo-3-video-generation";
const TITLE = "Veo 3 AI Video Generation Access | Farix AI";
const DESCRIPTION =
  "Get instant Veo 3 AI video generation access through Farix AI. Create cinematic text-to-video clips and hyper-realistic AI shorts — no accounts, no setup, no hassle.";

const content: ToolLandingContent = {
  eyebrow: "Veo 3 · AI video generation",
  h1: "Generate Cinematic Videos with Veo 3 on Farix AI",
  intro:
    "Veo 3 is Google's flagship text-to-video model. Farix AI gives you managed, invite-only access so you can go straight from a prompt to a finished cinematic clip — no sign-ups, no billing setup, no regional blocks.",
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
  sections: [
    {
      heading: "What is Veo 3 AI video generation?",
      paragraphs: [
        "Veo 3 is Google DeepMind's text-to-video generation model. Instead of assembling clips in an editor, you write a description of the shot you want and the model synthesises the footage frame by frame — subject, environment, lighting, camera movement and motion physics all generated together.",
        "What separates Veo 3 from earlier AI video tools is temporal consistency. Faces, clothing, props and backgrounds hold their identity across the length of a clip, so the result looks like a single continuous take rather than a sequence of loosely related frames. Camera instructions such as dolly in, handheld, aerial or macro are respected, which makes the output directly usable in real content instead of only being a novelty.",
        "On Farix AI you use Veo 3 through Google Flow with a managed session. You do not create a Google account, you do not add a payment method, and you do not deal with regional availability — you sign in to Farix AI, install one Chrome extension, and start prompting.",
      ],
    },
    {
      heading: "How to write prompts that actually work",
      paragraphs: [
        "The single biggest quality jump in AI video comes from prompt structure, not from luck. A strong Veo 3 prompt reads like a shot list entry: it names the subject, the action, the environment, the lens and camera move, the lighting, and the overall mood, in that order.",
        "Compare a weak prompt — \"a man walking in a city\" — with a strong one: \"medium tracking shot, a man in a charcoal overcoat walking through a rain-soaked Tokyo alley at night, neon signage reflecting in puddles, shallow depth of field, 35mm anamorphic, moody cinematic grade.\" The second prompt gives the model the same information a cinematographer would need, and the output improves accordingly.",
      ],
      bullets: [
        "Lead with the shot type: wide, medium, close-up, tracking, aerial, macro.",
        "Describe one clear action — Veo 3 handles a single beat far better than three.",
        "Name the lighting explicitly: golden hour, harsh noon, neon night, soft window light.",
        "Add lens and grade language: 35mm, anamorphic, shallow depth of field, film grain.",
        "Keep the clip short and specific; stitch multiple generations for longer sequences.",
      ],
    },
    {
      heading: "Why creators use Farix AI instead of a standalone account",
      paragraphs: [
        "Direct access to frontier video models is expensive, region-locked and credit-metered. Most creators burn a monthly allowance in a couple of sessions and then wait for a reset in the middle of a project. Farix AI removes that friction: your plan gives you unlimited Veo 3 Lite generation until your expiry date, with no per-clip credit counter running in the background.",
        "Access is handled by a secure Chrome extension that injects a managed session for you. There is nothing to configure — you install the extension once, click inject, and Google Flow opens ready to use. Renewals, support and access issues run through your reseller, so you spend your time producing content rather than managing subscriptions.",
      ],
    },
  ],
  steps: [
    {
      title: "Get activated",
      body: "Your reseller creates your Farix AI account with a Pro or Master plan and an expiry date. Access is invite-only, so there is no public signup queue.",
    },
    {
      title: "Install the extension",
      body: "Download the Farix Chrome extension from your dashboard and install it. One click injects a managed Veo 3 session — no credentials to copy or configure.",
    },
    {
      title: "Prompt and generate",
      body: "Google Flow opens ready to use. Write your shot description, generate, and download the clip. Repeat as often as you need until your plan expires.",
    },
  ],
  useCases: [
    {
      title: "Short-form creators",
      body: "Produce vertical Reels, Shorts and TikToks daily without a camera, actors, location or editing suite.",
    },
    {
      title: "Marketing and ad teams",
      body: "Test ten creative directions in an afternoon before committing budget to a full production shoot.",
    },
    {
      title: "Faceless channels",
      body: "Build cinematic B-roll libraries for documentary, storytelling and listicle channels at near-zero marginal cost.",
    },
    {
      title: "Agencies and freelancers",
      body: "Deliver motion concepts and animated pitch boards to clients in hours instead of weeks.",
    },
    {
      title: "E-commerce sellers",
      body: "Generate product-in-scene lifestyle footage for listings, landing pages and paid social.",
    },
    {
      title: "Educators and explainers",
      body: "Illustrate abstract ideas with generated visuals when stock footage simply does not exist.",
    },
  ],
  specs: [
    { label: "Model", value: "Veo 3.1 Lite via Google Flow" },
    { label: "Generation type", value: "Text-to-video, cinematic motion" },
    { label: "Aspect ratios", value: "Vertical 9:16, horizontal and square supported by Flow" },
    { label: "Usage limit", value: "Unlimited generation until your plan expiry date — no credits" },
    { label: "Included in", value: "Pro plan and Master plan" },
    { label: "Access method", value: "Farix Chrome extension with managed session injection" },
    { label: "Devices", value: "Desktop Chrome — setup guides available for PC and mobile" },
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
  faqs: [
    {
      q: "What is Veo 3 and who makes it?",
      a: "Veo 3 is Google DeepMind's text-to-video generation model. It converts a written prompt into short, high-motion video with realistic lighting, physics and camera behaviour. Farix AI provides managed access to it through Google Flow.",
    },
    {
      q: "Do I need my own Google account to use Veo 3 on Farix AI?",
      a: "No. Farix AI provides a managed session through the Farix Chrome extension. You sign in to your Farix AI dashboard, install the extension, and inject the session with one click — no personal Google account, verification or payment method is required.",
    },
    {
      q: "Is there a credit limit on video generations?",
      a: "No credit counter. Your plan gives unlimited Veo 3 Lite generation until your expiry date. When your plan expires, access stops until your reseller renews it.",
    },
    {
      q: "Which Farix AI plan includes Veo 3?",
      a: "Both the Pro plan and the Master plan include unlimited Veo 3 Lite access. The Master plan adds Gemini Pro chat on top.",
    },
    {
      q: "Can I use Veo 3 on my phone?",
      a: "Veo 3 works best on desktop Chrome because the Farix extension handles session injection there. Your dashboard includes step-by-step video guides for both PC/laptop and mobile setups.",
    },
    {
      q: "Can I use the generated videos commercially?",
      a: "Farix AI does not add extra restrictions on your output, but usage is ultimately governed by the underlying model provider's terms. Review those terms before using generated footage in paid client or advertising work.",
    },
    {
      q: "How long does one video take to generate?",
      a: "Typical Veo 3 Lite clips return within a few minutes depending on queue load and prompt complexity. Shorter, more specific prompts generally render faster and more reliably than long, multi-action descriptions.",
    },
    {
      q: "How do I sign up for Farix AI?",
      a: "Farix AI is invite-only. You receive credentials from an authorised reseller, then sign in at the login page. There is no public self-signup form.",
    },
  ],
  ctaTitle: "Start generating with Veo 3 today",
  ctaBody:
    "Farix AI is invite-only. Sign in with the credentials from your reseller, or view the plans that include Veo 3.",
};

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
            { "@type": "ListItem", position: 2, name: "Veo 3 Video Generation", item: `${SITE_URL}${PATH}` },
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
