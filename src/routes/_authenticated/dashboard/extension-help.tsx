import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyTools } from "@/hooks/use-my-tools";
import { Download, Monitor, Smartphone, ArrowLeft, Puzzle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/extension-help")({
  component: ExtensionHelpPage,
  head: () => ({
    meta: [
      { title: "Extension & Help | Farix AI Workspace" },
      {
        name: "description",
        content: "Download the Farix extension and learn how to use Farix on PC, laptop, and mobile.",
      },
      { property: "og:title", content: "Extension & Help | Farix AI Workspace" },
      {
        property: "og:description",
        content: "Download the Farix extension and learn how to use Farix on PC, laptop, and mobile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function StepCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:border-brand-pink/25 dark:hover:border-brand-pink/30 dark:hover:shadow-[0_16px_44px_-18px_color-mix(in_oklab,var(--brand-violet)_35%,transparent)]">
      <div className="flex items-center gap-3.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-pink/20 via-brand-violet/15 to-brand-violet/10 text-foreground dark:from-brand-pink/30 dark:via-brand-violet/25 dark:to-brand-violet/10 dark:text-white glow-icon">
          {icon}
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ExtensionHelpPage() {
  const { downloadExtension, loading } = useMyTools();

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-card p-8 dark:glow-card">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-pink/25 via-brand-violet/20 to-brand-violet/10 text-foreground dark:from-brand-pink/30 dark:via-brand-violet/25 dark:to-brand-violet/10 dark:text-white glow-icon">
              <Puzzle className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Extension</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                One Farix extension works for Veo 3, Gemini Pro, and Whisk. Download once, then
                Inject the tool you want.
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadExtension()}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 font-display text-sm font-semibold text-white shadow-glow transition-all hover:shadow-[0_0_24px_-6px_color-mix(in_oklab,var(--brand-pink)_40%,transparent)] dark:hover:shadow-[0_0_32px_-6px_color-mix(in_oklab,var(--brand-pink)_55%,transparent)] active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Download Extension
          </button>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <StepCard icon={<Monitor className="h-5 w-5" />} title="How to use on PC & Laptop">
          <ol className="list-decimal space-y-4 pl-6 text-sm leading-relaxed text-muted-foreground marker:text-foreground marker:font-medium">
            <li>Download the extension using the button above.</li>
            <li>Open Chrome and go to the Extensions window.</li>
            <li>Turn on Developer mode.</li>
            <li>Unzip the extension file, then click Load unpacked and select the unzipped folder.</li>
            <li>Come back to this site and reload — the extension will login automatically.</li>
            <li>
              Click the Farix extension icon, choose a tool (Veo 3 / Gemini Pro / Whisk), then
              click Inject.
            </li>
          </ol>
        </StepCard>

        <StepCard icon={<Smartphone className="h-5 w-5" />} title="How to use on Mobile">
          <ol className="list-decimal space-y-4 pl-6 text-sm leading-relaxed text-muted-foreground marker:text-foreground marker:font-medium">
            <li>
              Open Play Store and download{" "}
              <a
                href="https://play.google.com/store/apps/details?id=com.lemurbrowser.exts"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-pink underline-offset-2 transition-colors hover:underline"
              >
                Lemur Browser
              </a>
              .
            </li>
            <li>Open Lemur Browser.</li>
            <li>Open our site and login.</li>
            <li>Download the extension from this page.</li>
            <li>In Lemur, go to Options → Extensions.</li>
            <li>Turn on Developer mode.</li>
            <li>Load the ZIP / extension package you downloaded.</li>
            <li>Return to this site and reload — the extension logs in automatically.</li>
            <li>Open the Farix extension, choose any tool, then click Inject.</li>
          </ol>
        </StepCard>
      </section>
    </div>
  );
}
