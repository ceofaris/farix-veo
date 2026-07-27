import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Farix — Secure Cookie Management Platform" },
      {
        name: "description",
        content: "Farix is a premium multi-tool cookie management platform for teams and resellers.",
      },
      { property: "og:title", content: "Farix — Secure Cookie Management Platform" },
      {
        property: "og:description",
        content: "Farix is a premium multi-tool cookie management platform for teams and resellers.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-black text-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center max-w-2xl text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">Farix</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-neutral-400">
          Cookie Management Platform
        </p>
        <h2 className="mt-10 text-3xl sm:text-4xl font-semibold leading-tight">
          One platform to manage every tool your team relies on.
        </h2>
        <p className="mt-5 text-neutral-400 text-lg">
          Secure, private, and centrally managed. Access is invite-only — reach out to your admin
          or reseller to receive credentials.
        </p>
        <Link
          to="/auth"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-white text-black font-medium px-8 py-3 hover:bg-neutral-200 transition"
        >
          Sign In
        </Link>
      </div>
      <footer className="absolute bottom-6 text-xs text-neutral-600">
        © {new Date().getFullYear()} Farix. All rights reserved.
      </footer>
    </div>
  );
}
