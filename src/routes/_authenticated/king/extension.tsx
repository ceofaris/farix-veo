import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell, Card } from "@/components/panel-layout";
import { Download, Star, Trash2, Upload, Puzzle } from "lucide-react";
import { toast } from "sonner";
import { uploadExtensionZip, signedExtensionUrl } from "@/lib/extension";

export const Route = createFileRoute("/_authenticated/king/extension")({
  component: KingExtension,
  head: () => ({
    meta: [
      { title: "Extension Versions | Farix King Panel" },
      { name: "description", content: "Upload, publish and manage Farix browser extension versions." },
      { property: "og:title", content: "Extension Versions | Farix King Panel" },
      { property: "og:description", content: "Upload, publish and manage Farix browser extension versions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type VersionRow = {
  id: string;
  version: string;
  notes: string | null;
  file_path: string;
  file_size: number | null;
  is_latest: boolean;
  created_at: string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function KingExtension() {
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const versions = useQuery({
    queryKey: ["extension-versions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extension_versions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as VersionRow[];
    },
  });

  async function upload() {
    if (!version.trim()) return toast.error("Enter a version name");
    if (!file) return toast.error("Choose a ZIP file");
    setUploading(true);
    try {
      const path = await uploadExtensionZip(file, version.trim());
      const { error } = await supabase.from("extension_versions").insert({
        version: version.trim(),
        notes: notes.trim() || null,
        file_path: path,
        file_size: file.size,
      });
      if (error) throw new Error(error.message);
      toast.success("Version uploaded");
      setVersion("");
      setNotes("");
      setFile(null);
      versions.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function setLatest(id: string) {
    const { error: clearErr } = await supabase
      .from("extension_versions")
      .update({ is_latest: false })
      .eq("is_latest", true);
    if (clearErr) return toast.error(clearErr.message);
    const { error } = await supabase.from("extension_versions").update({ is_latest: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marked as latest");
    versions.refetch();
  }

  async function download(row: VersionRow) {
    const url = await signedExtensionUrl(row.file_path);
    if (!url) return toast.error("Could not create download link");
    window.open(url, "_blank");
  }

  async function remove(row: VersionRow) {
    if (!confirm(`Delete version ${row.version}?`)) return;
    await supabase.storage.from("extensions").remove([row.file_path]);
    const { error } = await supabase.from("extension_versions").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    versions.refetch();
  }

  const latest = versions.data?.find((v) => v.is_latest);

  return (
    <div>
      <PageHeader title="Extension" description="Upload and publish browser extension builds." />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <div className="flex items-center gap-2 font-medium">
            <Upload className="h-4 w-4" /> Upload new version
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label>Release notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label>ZIP file</Label>
              <Input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="bg-background border-border"
              />
            </div>
            <Button onClick={upload} disabled={uploading} className="w-full">
              {uploading ? "Uploading…" : "Upload version"}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 font-medium">
            <Puzzle className="h-4 w-4" /> Current release
          </div>
          {latest ? (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div>
                <div className="text-2xl font-semibold tracking-tight">v{latest.version}</div>
                <div className="text-xs text-muted-foreground">
                  Published {new Date(latest.created_at).toLocaleDateString()} · {formatSize(latest.file_size)}
                </div>
              </div>
              <Button onClick={() => download(latest)} className="ml-auto">
                <Download className="h-4 w-4 mr-1.5" /> Download latest
              </Button>
              {latest.notes && (
                <p className="w-full text-sm text-muted-foreground whitespace-pre-wrap">{latest.notes}</p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No version marked as latest yet. Upload a build and mark it as latest.
            </p>
          )}
        </Card>
      </div>

      <TableShell>
        <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
          <tr>
            <th className="px-5 py-3.5 font-semibold">Version</th>
            <th className="px-5 py-3.5 font-semibold">Uploaded</th>
            <th className="px-5 py-3.5 font-semibold">Size</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {versions.data?.map((v) => (
            <tr key={v.id} className="border-t border-border transition-colors hover:bg-muted/40">
              <td className="px-5 py-4 font-medium">v{v.version}</td>
              <td className="px-5 py-4 text-muted-foreground">{new Date(v.created_at).toLocaleString()}</td>
              <td className="px-5 py-4 text-muted-foreground">{formatSize(v.file_size)}</td>
              <td className="px-5 py-4">
                {v.is_latest ? <Badge>Latest</Badge> : <Badge variant="secondary">Archived</Badge>}
              </td>
              <td className="px-5 py-4 text-right space-x-1">
                {!v.is_latest && (
                  <Button size="sm" variant="ghost" onClick={() => setLatest(v.id)} title="Mark as latest">
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => download(v)} title="Download">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(v)} title="Delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
          {versions.data?.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-14 text-center text-muted-foreground">
                No extension versions uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>
    </div>
  );
}
