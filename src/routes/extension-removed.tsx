import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldOff } from "lucide-react";

export const Route = createFileRoute("/extension-removed")({
  head: () => ({
    meta: [
      { title: "Extension Removed — Farix AI Session Logged Out" },
      {
        name: "description",
        content:
          "The Farix AI ChatGPT extension was removed or disabled, so the managed ChatGPT session has been logged out and cookies cleared.",
      },
      { property: "og:title", content: "Extension Removed — Farix AI" },
      {
        property: "og:description",
        content:
          "Your managed ChatGPT session has been logged out because the Farix AI extension was removed or disabled.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExtensionRemoved,
});

function ExtensionRemoved() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldOff className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Extension removed — session logged out
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The Farix AI ChatGPT extension was removed or disabled. For security, the
          managed ChatGPT session has been cleared and its cookies removed from this
          browser.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reinstall the extension and sign in again to continue using your managed
          access.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Back to Farix AI
        </Link>
      </section>
    </main>
  );
}
