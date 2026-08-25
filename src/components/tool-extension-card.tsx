import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Download, Trash2, Upload, Puzzle } from "lucide-react";
import { toast } from "sonner";
import { uploadExtensionZip, signedExtensionUrl } from "@/lib/extension";

type VersionRow = {
  id: string;
  version: string;
  notes: string | null;
  file_path: string;
  file_size: number | null;
  created_at: string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

/** Upload + manage the single (latest) extension build for one tool. */
export function ToolExtensionCard({ toolId, toolName }: { toolId: string; toolName: string }) {
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const current = useQuery({
    queryKey: ["tool-extension", toolId],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extension_versions")
        .select("id, version, notes, file_path, file_size, created_at")
        .eq("tool_id", toolId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as VersionRow | null;
    },
  });

  async function upload() {
    if (!version.trim()) return toast.error("Enter a version name");
    if (!file) return toast.error("Choose a ZIP file");
    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const path = await uploadExtensionZip(file, version.trim());
      uploadedPath = path;
      const previous = current.data;
      const { error } = await supabase.from("extension_versions").upsert(
        {
          tool_id: toolId,
          version: version.trim(),
          notes: notes.trim() || null,
          file_path: path,
          file_size: file.size,
          is_latest: true,
        },
        { onConflict: "tool_id" },
      );
      if (error) throw new Error(error.message);
      uploadedPath = null;
      // Only the newest build is kept — remove the replaced file from storage.
      if (previous && previous.file_path !== path) {
        await supabase.storage.from("extensions").remove([previous.file_path]);
      }
      toast.success("Extension updated");
      setVersion("");
      setNotes("");
      setFile(null);
      await current.refetch();
    } catch (e) {
      if (uploadedPath) {
        await supabase.storage.from("extensions").remove([uploadedPath]);
      }
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!current.data) return;
    const url = await signedExtensionUrl(current.data.file_path);
    if (!url) return toast.error("Could not create download link");
    window.open(url, "_blank");
  }

  async function remove() {
    const row = current.data;
    if (!row) return;
    if (!confirm(`Delete the ${toolName} extension (${row.version})?`)) return;
    await supabase.storage.from("extensions").remove([row.file_path]);
    const { error } = await supabase.from("extension_versions").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    current.refetch();
  }

  return (
    <section className="surface-card rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Puzzle className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold">{toolName} Extension</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Uploading a new build replaces the previous one — only the latest version is kept.
      </p>

      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        {current.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : current.data ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">v{current.data.version}</span>
                <Badge>Latest</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Uploaded {new Date(current.data.created_at).toLocaleString()} ·{" "}
                {formatSize(current.data.file_size)}
              </p>
              {current.data.notes && (
                <p className="text-xs text-muted-foreground mt-1">{current.data.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={download}>
                <Download className="w-4 h-4 mr-1.5" /> Download
              </Button>
              <Button size="sm" variant="ghost" onClick={remove}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No extension uploaded for this tool yet.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <Label>Version</Label>
          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
            className="bg-background border-border"
          />
        </div>
        <div className="md:col-span-2">
          <Label>ZIP file</Label>
          <Input
            type="file"
            accept=".zip,application/zip"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="bg-background border-border"
          />
        </div>
        <div className="md:col-span-3">
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="bg-background border-border"
          />
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={upload} disabled={busy}>
          <Upload className="w-4 h-4 mr-1.5" />
          {busy ? "Uploading…" : current.data ? "Upload new version" : "Upload extension"}
        </Button>
      </div>
    </section>
  );
}
