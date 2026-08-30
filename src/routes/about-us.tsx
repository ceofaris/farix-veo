import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about-us")({
  beforeLoad: () => {
    throw redirect({ to: "/p/about-us", statusCode: 301 });
  },
});
