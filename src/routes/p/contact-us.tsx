import { createFileRoute } from "@tanstack/react-router";
import { ContentPage, type ContentBlock } from "@/components/content-page";

const SITE_URL = "https://farixai.com";
const PATH = "/p/contact-us";
const TITLE = "Contact Farix AI | Support, Sales and Reseller Enquiries";
const DESCRIPTION =
  "Contact Farix AI for account activation, plan renewals, extension support or reseller partnership enquiries. Email support@farixai.com and we will get back to you.";

const blocks: ContentBlock[] = [
  {
    heading: "How to reach us",
    paragraphs: [
      "The fastest route for anything account-related is the reseller who activated your Farix AI plan — they handle activations, renewals and day-to-day support in your own market and language. For everything else, email us directly and we will route your message to the right person.",
    ],
    bullets: [
      "General support: support@farixai.com",
      "Sales and new activations: support@farixai.com",
      "Reseller partnerships: support@farixai.com",
      "Privacy and data requests: support@farixai.com",
    ],
  },
  {
    heading: "Support hours and response time",
    paragraphs: [
      "We answer emails 7 days a week, typically within 24 hours (Pakistan Standard Time, UTC+5). Access issues affecting an active plan are prioritised over general enquiries.",
    ],
  },
  {
    heading: "Before you write about an access problem",
    paragraphs: [
      "A few details make it much faster for us to fix your issue. Please include the following in your first message:",
    ],
    bullets: [
      "The email address on your Farix AI account.",
      "Which tool is affected — Veo 3, Gemini Pro or image generation.",
      "Your plan (Pro or Master) and the reseller who activated you.",
      "The extension version you installed and your browser.",
      "A screenshot of the error or the screen you get stuck on.",
    ],
  },
  {
    heading: "Want to become a reseller?",
    paragraphs: [
      "Resellers activate users, set plan durations, handle payments locally and get their own dashboard with user management and earnings tracking. If you have an existing audience of creators, marketers or students, email us with your market, expected volume and how you plan to support your users.",
    ],
  },
  {
    heading: "Existing users",
    paragraphs: [
      "If you already have an account, sign in to your dashboard first — the download links, setup video guides for PC and mobile, and your plan expiry date are all there. Most setup questions are answered by those guides before support is needed.",
    ],
  },
];

export const Route = createFileRoute("/p/contact-us")({
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
          "@type": "ContactPage",
          name: TITLE,
          url: `${SITE_URL}${PATH}`,
          description: DESCRIPTION,
        }),
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ContentPage
      eyebrow="Company · Contact"
      title="Contact Us"
      intro="Questions about activation, renewals, extension setup or reseller partnerships? Here is how to reach the Farix AI team."
      blocks={blocks}
    />
  );
}
