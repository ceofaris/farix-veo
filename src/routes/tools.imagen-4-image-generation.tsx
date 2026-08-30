import { createFileRoute } from "@tanstack/react-router";
import { ToolLanding, type ToolLandingContent } from "@/components/tool-landing";

const SITE_URL = "https://farixai.com";
const PATH = "/tools/imagen-4-image-generation";
const TITLE = "Imagen 4 Ultra AI Image Generation Access | Farix AI";
const DESCRIPTION =
  "Get Imagen 4 Ultra AI image generation access through Farix AI. Create photorealistic text-to-image visuals with accurate typography — no accounts, no setup, no hassle.";

const content: ToolLandingContent = {
  eyebrow: "Imagen 4 Ultra · AI image generation",
  h1: "Create Photorealistic Images with Imagen 4 on Farix AI",
  intro:
    "Imagen 4 Ultra is Google's highest-fidelity text-to-image model. Farix AI gives you managed, invite-only access so you can generate campaign-ready visuals in seconds — no account creation, no credit packs, no regional blocks.",
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
  sections: [
    {
      heading: "What is Imagen 4 Ultra image generation?",
      paragraphs: [
        "Imagen 4 Ultra is the highest-quality tier of Google's Imagen text-to-image family. You write a description and the model renders an original image — no stock library, no photographer, no studio. Where it pulls ahead of most generators is physical realism: skin texture, fabric weave, metal reflections, glass refraction and natural light falloff are rendered convincingly enough to survive a full-resolution crop.",
        "The other standout capability is in-image typography. Earlier generations of image models famously mangled text, which made them useless for posters, packaging mockups and thumbnails. Imagen 4 Ultra renders short headlines and labels far more accurately, so it can be used for real design work rather than only for background art.",
        "On Farix AI, Imagen 4 Ultra is available alongside Nano Banana 1 and 2 inside the same managed session. You generate a base image with Imagen for maximum fidelity, then use Nano Banana for fast edits, variations and iterations without leaving the workflow.",
      ],
    },
    {
      heading: "How to prompt Imagen 4 for photorealistic results",
      paragraphs: [
        "Treat the prompt like a photography brief. The model responds to the vocabulary a photographer or art director would actually use, so naming the camera, lens, lighting setup and surface materials produces dramatically better output than adjectives like \"beautiful\" or \"high quality\".",
        "A useful pattern is: subject, then setting, then lighting, then camera and lens, then styling and mood. For example: \"a matte black ceramic coffee mug on a weathered oak table, morning window light from the left, soft shadows, 85mm lens, shallow depth of field, editorial product photography.\" Each clause gives the model a decision it would otherwise make randomly.",
      ],
      bullets: [
        "Name the material explicitly — brushed aluminium, frosted glass, raw linen, matte plastic.",
        "Describe the light source and direction, not just the time of day.",
        "Add lens language: 35mm environmental, 85mm portrait, 100mm macro, tilt-shift.",
        "Keep in-image text to a few words for the most reliable typography.",
        "State the aspect ratio you need so composition is framed correctly from the start.",
      ],
    },
    {
      heading: "Imagen 4 Ultra vs. Nano Banana — when to use each",
      paragraphs: [
        "Imagen 4 Ultra is the fidelity model. Reach for it when the image is the deliverable: hero shots, print-adjacent artwork, product photography replacements and anything that will be viewed large.",
        "Nano Banana is the iteration model. It is faster and excels at editing an existing image — swapping a background, changing a colourway, adjusting a pose or producing a batch of variations for A/B testing. The practical workflow is to establish the look with Imagen and then iterate with Nano Banana, which is exactly how both are bundled in your Farix AI plan.",
      ],
    },
  ],
  steps: [
    {
      title: "Get activated",
      body: "Your reseller creates your Farix AI account with an active plan and expiry date. Access is invite-only, so there is no waiting list or public signup.",
    },
    {
      title: "Install the extension",
      body: "Download the Farix Chrome extension from your dashboard. One click injects a managed session — no credentials, no billing details, no configuration.",
    },
    {
      title: "Generate and refine",
      body: "Write your image brief, generate with Imagen 4 Ultra, then iterate with Nano Banana until the shot matches what you had in mind. Download at full resolution.",
    },
  ],
  useCases: [
    {
      title: "E-commerce sellers",
      body: "Replace expensive product photoshoots with lifestyle and studio-style renders for listings and ads.",
    },
    {
      title: "Thumbnail designers",
      body: "Produce high-contrast, readable YouTube thumbnails with accurate in-image text in minutes.",
    },
    {
      title: "Brand and ad teams",
      body: "Explore dozens of visual directions before committing budget to a production shoot.",
    },
    {
      title: "Social media managers",
      body: "Keep a consistent visual identity across daily posts without a designer in the loop.",
    },
    {
      title: "Print and poster design",
      body: "Generate key art, event posters and packaging mockups with legible headline typography.",
    },
    {
      title: "Content writers and bloggers",
      body: "Illustrate articles with original visuals instead of recycled stock photography.",
    },
  ],
  specs: [
    { label: "Model", value: "Imagen 4 Ultra, plus Nano Banana 1 and 2" },
    { label: "Generation type", value: "Text-to-image and image editing / variations" },
    { label: "Strengths", value: "Photorealism, material accuracy, in-image typography" },
    { label: "Aspect ratios", value: "Square, portrait, landscape and social-native formats" },
    { label: "Usage limit", value: "No per-image credit packs — generate until your plan expires" },
    { label: "Access method", value: "Farix Chrome extension with managed session injection" },
    { label: "Devices", value: "Desktop Chrome — setup guides available for PC and mobile" },
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
  faqs: [
    {
      q: "What is Imagen 4 Ultra?",
      a: "Imagen 4 Ultra is the highest-fidelity tier of Google's Imagen text-to-image model family. It generates photorealistic images from written prompts, with strong material realism, natural lighting and unusually accurate in-image text.",
    },
    {
      q: "Do I need my own account or credit card?",
      a: "No. Farix AI provides managed access through the Farix Chrome extension. You sign in to your Farix dashboard, install the extension, inject the session, and start generating — no signup, verification or payment method of your own.",
    },
    {
      q: "Is Nano Banana included as well?",
      a: "Yes. Nano Banana 1 and 2 are available in the same session, which lets you generate a high-fidelity base image with Imagen 4 Ultra and then iterate on edits and variations quickly.",
    },
    {
      q: "Can Imagen 4 render text inside images correctly?",
      a: "It handles short headlines and labels far more reliably than earlier image models, which makes it practical for thumbnails, posters and packaging mockups. Keep text short — a few words render most accurately.",
    },
    {
      q: "What resolution and aspect ratios are supported?",
      a: "You can generate square, portrait, landscape and social-native aspect ratios at high resolution suitable for web, ads and most digital deliverables.",
    },
    {
      q: "Can I use the images commercially?",
      a: "Farix AI adds no extra restrictions on your output, but usage remains governed by the underlying model provider's terms. Review those terms before using generated images in paid client or advertising work.",
    },
    {
      q: "Which plan includes image generation?",
      a: "Image generation is bundled with the Farix AI plans that include the Google creative suite. Check the pricing section for the current plan breakdown, or ask your reseller which plan fits your workload.",
    },
    {
      q: "How do I get access to Farix AI?",
      a: "Farix AI is invite-only. An authorised reseller creates your account and gives you credentials — there is no public self-signup form.",
    },
  ],
  ctaTitle: "Start creating with Imagen 4 today",
  ctaBody:
    "Farix AI is invite-only. Sign in with the credentials from your reseller, or view the plans that include Imagen 4 Ultra.",
};

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
            { "@type": "ListItem", position: 2, name: "Imagen 4 Image Generation", item: `${SITE_URL}${PATH}` },
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
