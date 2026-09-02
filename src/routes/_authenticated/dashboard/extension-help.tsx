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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan">
          {icon}
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ExtensionHelpPage() {
  const { downloadExtension, findTool, loading } = useMyTools();

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard" className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan">
              <Puzzle className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Extension</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                One Farix extension works for Veo 3, Gemini Pro, and Whisk. Download once, then
                Inject the tool you want.
              </p>
            </div>
          </div>
          <button
            onClick={() => downloadExtension(findTool(/veo|flow/i)?.id)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Download Extension
          </button>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <StepCard icon={<Monitor className="h-5 w-5" />} title="How to use on PC & Laptop">
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground marker:text-foreground">
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
          <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground marker:text-foreground">
            <li>
              Open Play Store and download{" "}
              <a
                href="https://play.google.com/store/apps/details?id=com.lemurbrowser.exts"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-cyan underline-offset-2 hover:underline"
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
