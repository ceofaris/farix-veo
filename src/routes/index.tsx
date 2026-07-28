import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 relative">
      <ThemeToggle className="absolute top-6 right-6" />
      <div className="flex flex-col items-center max-w-2xl text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/12 text-primary border border-primary/20 mb-6">
          <Shield className="w-8 h-8 text-foreground" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight">Farix</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Cookie Management Platform
        </p>
        <h2 className="mt-10 text-3xl sm:text-4xl font-semibold leading-tight">
          One platform to manage every tool your team relies on.
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          Secure, private, and centrally managed. Access is invite-only — reach out to your admin
          or reseller to receive credentials.
        </p>
        <Link
          to="/auth"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium px-8 py-3 shadow-card hover:opacity-90 active:scale-[0.98] transition"
        >
          Sign In
        </Link>
      </div>
      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Farix. All rights reserved.
      </footer>
    </div>
  );
}
