import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FlaskConical, FileCode2, Info } from "lucide-react";
import {
  devExtensionFiles,
  downloadDevZip,
  devMultiExtensionFiles,
  downloadMultiDevZip,
  devGeminiExtensionFiles,
  downloadGeminiDevZip,
  devWhiskExtensionFiles,
  downloadWhiskDevZip,
  type DevFile,
} from "@/lib/extension-dev";

export const Route = createFileRoute("/_authenticated/king/extension-lab")({
  component: ExtensionLab,
  head: () => ({
    meta: [
      { title: "Extension Lab — Farix King Panel" },
      { name: "description", content: "Development workspace for the Farix Veo 3 and Gemini Chrome extensions." },
      { property: "og:title", content: "Extension Lab — Farix King Panel" },
      { property: "og:description", content: "Development workspace for the Farix Veo 3 and Gemini Chrome extensions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(1)} KB`;
}

function LabSection({
  title,
  folder,
  files,
  onDownload,
  note,
}: {
  title: string;
  folder: string;
  files: DevFile[];
  onDownload: () => void;
  note: string;
}) {
  const total = files.reduce((s, f) => s + f.bytes, 0);
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{title}</h2>
              <Badge variant="outline" className="bg-accent text-accent-foreground border-border">
                {folder}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {files.length} files · {formatBytes(total)}
            </p>
          </div>
          <Button onClick={onDownload} disabled={files.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Download Dev ZIP
          </Button>
        </div>

        <div className="mt-5 pt-4 border-t border-border flex gap-2 text-sm text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{note}</p>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-sm">
          Source files <span className="font-mono text-xs text-muted-foreground">{folder}</span>
        </h3>
        <ul className="mt-3 divide-y divide-border">
          {files.map((f) => (
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

function ExtensionLab() {
  return (
    <div>
      <PageHeader
        title="Extension Lab"
        description="Development versions of the Farix Chrome extensions, kept fully separate and editable in this project."
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-2 items-start">
        <LabSection
          title="Farix Veo Extension (dev)"
          folder="extension-dev/"
          files={devExtensionFiles}
          onDownload={downloadDevZip}
          note="Veo 3 only — files live in extension-dev/. For testing only; upload the final version from Tools → Veo 3 → Upload Extension."
        />

        <LabSection
          title="Farix Multi Extension (dev)"
          folder="extension-dev-multi/"
          files={devMultiExtensionFiles}
          onDownload={downloadMultiDevZip}
          note="Veo 3 (Flow) + Gemini Pro + Whisk in one — files live in extension-dev-multi/. Whisk is included here and shares the Flow/Veo cookie pool (no second package, no separate accounts). Cookies stay isolated per site and access follows the user plan."
        />
        <LabSection
          title="Farix Gemini Extension (dev)"
          folder="extension-dev-gemini/"
          files={devGeminiExtensionFiles}
          onDownload={downloadGeminiDevZip}
          note="Gemini Pro only — files live in extension-dev-gemini/. For testing only; upload the final version from Tools → Gemini Pro → Upload Extension."
        />
        <LabSection
          title="Farix Whisk Extension (dev)"
          folder="extension-dev-whisk/"
          files={devWhiskExtensionFiles}
          onDownload={downloadWhiskDevZip}
          note="Whisk only — uses the Flow/Veo cookie pool (no separate Whisk accounts) and opens the Whisk tool URL after injection."
        />
      </div>
    </div>
  );
}
