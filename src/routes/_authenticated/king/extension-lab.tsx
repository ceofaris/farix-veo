import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FlaskConical, FileCode2, Info } from "lucide-react";
import { devExtensionFiles, downloadDevZip } from "@/lib/extension-dev";

export const Route = createFileRoute("/_authenticated/king/extension-lab")({
  component: ExtensionLab,
  head: () => ({
    meta: [
      { title: "Extension Lab — Farix King Panel" },
      { name: "description", content: "Development workspace for the Farix Veo 3 Chrome extension source." },
      { property: "og:title", content: "Extension Lab — Farix King Panel" },
      { property: "og:description", content: "Development workspace for the Farix Veo 3 Chrome extension source." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

function ExtensionLab() {
  const total = devExtensionFiles.reduce((s, f) => s + f.bytes, 0);

  return (
    <div>
      <PageHeader
        title="Extension Lab"
        description="Development version of the Veo 3 Chrome extension, editable directly in this project."
      />

      <Card className="mt-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Farix Veo Extension (dev)</h2>
              <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
                extension-dev/
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {devExtensionFiles.length} files · {formatBytes(total)}
            </p>
          </div>
          <Button onClick={downloadDevZip}>
            <Download className="w-4 h-4 mr-2" /> Download Dev ZIP
          </Button>
        </div>

        <div className="mt-5 pt-4 border-t border-border flex gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>This is for testing only. Upload final version from Tools → Veo 3 → Upload Extension.</p>
        </div>
      </Card>

      <Card className="mt-5">
        <h3 className="font-semibold text-sm">Source files</h3>
        <ul className="mt-3 divide-y divide-border">
          {devExtensionFiles.map((f) => (
            <li key={f.path} className="flex items-center gap-3 py-2.5 text-sm">
              <FileCode2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-mono truncate">{f.path}</span>
              <span className="ml-auto text-xs text-muted-foreground">{formatBytes(f.bytes)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
