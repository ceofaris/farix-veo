import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy SEO page. ChatGPT is no longer part of the Farix AI product, so this
 * route permanently redirects to the Veo 3 tool page.
 */
export const Route = createFileRoute("/tools/chatgpt-access")({
  beforeLoad: () => {
    throw redirect({ to: "/tools/veo-3-video-generation", statusCode: 301 });
  },
});
