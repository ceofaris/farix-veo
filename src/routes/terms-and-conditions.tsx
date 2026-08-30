import { createFileRoute } from "@tanstack/react-router";
import { ContentPage, type ContentBlock } from "@/components/content-page";

const SITE_URL = "https://farixai.com";
const PATH = "/terms-and-conditions";
const TITLE = "Terms and Conditions | Farix AI";
const DESCRIPTION =
  "The terms that govern your use of Farix AI: invite-only accounts, plan rules, fair use of managed AI tool sessions, payments through resellers, suspension and liability.";

const blocks: ContentBlock[] = [
  {
    heading: "1. Agreement",
    paragraphs: [
      "These Terms and Conditions govern your use of the Farix AI platform, dashboard and browser extensions. By signing in with credentials provided by an authorised reseller, you accept these terms in full. If you do not accept them, do not use the platform.",
    ],
  },
  {
    heading: "2. Invite-only access",
    paragraphs: [
      "Farix AI has no public signup. Accounts are created by authorised resellers or the platform owner, with a plan and an expiry date attached. Access ends automatically on the expiry date unless renewed through your reseller.",
    ],
    bullets: [
      "Your account is personal and non-transferable.",
      "Single-device login is enforced; signing in elsewhere may end your active session.",
      "Sharing, reselling or publishing your credentials is grounds for immediate termination without refund.",
    ],
  },
  {
    heading: "3. Plans and what they include",
    bullets: [
      "Pro: Veo 3 (Lite) unlimited generation plus Niche Prompts. ChatGPT and Gemini Pro are not included.",
      "Master: Veo 3 (Lite) unlimited generation, Gemini Pro chat, ChatGPT (testing phase, limited access), Niche Prompts and all other Master features.",
      "Features marked \"Coming Soon\" are not guaranteed and may change, be delayed or be withdrawn.",
    ],
  },
  {
    heading: "4. Managed sessions and fair use",
    paragraphs: [
      "Tool access is provided through managed sessions injected into the official interfaces of third-party providers. Those sessions are shared infrastructure and are intentionally locked down: profile, billing and settings areas are disabled and account names are masked.",
    ],
    bullets: [
      "Do not attempt to unlock, extract, export or reuse session cookies outside the Farix extension.",
      "Do not automate, script or bulk-generate in a way that risks the underlying accounts.",
      "Do not use the tools to create illegal, harmful, hateful, deceptive or infringing content.",
      "Do not enter confidential, financial or personal data into a managed session.",
      "Abnormal usage that endangers shared accounts may be throttled or suspended without notice.",
    ],
  },
  {
    heading: "5. Payments, renewals and refunds",
    paragraphs: [
      "Plan pricing, payment collection and renewals are handled by the reseller who activated your account. Farix AI records paid/unpaid status for administration but does not process your payment directly.",
      "Because access is granted instantly on activation, plans are generally non-refundable. Any refund or credit is at the discretion of your reseller and the platform owner, and typically only where access could not be delivered at all.",
    ],
  },
  {
    heading: "6. Availability",
    paragraphs: [
      "Farix AI depends on third-party providers. Interfaces, models, quotas and feature availability can change at any time without notice. We aim for high availability but do not guarantee uninterrupted service, specific generation limits, or that any particular model remains accessible for the duration of your plan.",
    ],
  },
  {
    heading: "7. Intellectual property",
    paragraphs: [
      "The Farix name, logo, dashboard, extensions and written content are owned by Farix AI. Veo, Flow, Gemini, Imagen, ChatGPT and other product names belong to their respective owners; Farix AI is an independent access platform and is not affiliated with, endorsed by or sponsored by Google or OpenAI.",
      "Rights to content you generate inside a third-party tool are governed by that provider's terms. You are responsible for checking those terms before commercial use.",
    ],
  },
  {
    heading: "8. Suspension and termination",
    paragraphs: [
      "We may suspend or terminate an account immediately for credential sharing, abuse of shared sessions, attempts to bypass lockdown restrictions, illegal use, or non-payment. Termination for breach does not entitle you to a refund of the remaining plan period.",
    ],
  },
  {
    heading: "9. Limitation of liability",
    paragraphs: [
      "The platform is provided on an \"as is\" and \"as available\" basis. To the maximum extent permitted by law, Farix AI is not liable for indirect or consequential losses, lost profits, lost data, or losses arising from third-party outages or policy changes. Where liability cannot be excluded, it is limited to the amount paid for your current plan period.",
    ],
  },
  {
    heading: "10. Changes and contact",
    paragraphs: [
      "We may update these terms as the platform evolves; continued use after an update constitutes acceptance. Questions can be sent to support@farixai.com or raised with your reseller.",
    ],
  },
];

export const Route = createFileRoute("/terms-and-conditions")({
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
      eyebrow="Legal · Terms"
      title="Terms and Conditions"
      intro="The rules for using Farix AI accounts, plans, managed sessions and extensions."
      updated="August 2026"
      blocks={blocks}
    />
  );
}
