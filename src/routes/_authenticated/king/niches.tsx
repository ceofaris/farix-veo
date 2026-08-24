import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, PageHeader } from "@/components/panel-layout";
import { NicheImage } from "@/components/niche-image";
import { nichesQuery, removeNicheImage, uploadNicheImage, type Niche } from "@/lib/niches";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/niches")({
  component: KingNiches,
  head: () => ({
    meta: [
      { title: "Niche Prompts | Farix King Panel" },
      { name: "description", content: "Create and manage the niche prompt library available to every Farix plan." },
      { property: "og:title", content: "Niche Prompts | Farix King Panel" },
      { property: "og:description", content: "Create and manage the niche prompt library available to every Farix plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function KingNiches() {
  const qc = useQueryClient();
  const niches = useQuery(nichesQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Niche | null>(null);

  async function handleDelete(n: Niche) {
    if (!confirm(`Delete "${n.name}"?`)) return;
    const { error } = await supabase.from("niches").delete().eq("id", n.id);
    if (error) return toast.error(error.message);
    await removeNicheImage(n.image_path);
    toast.success("Niche deleted");
    qc.invalidateQueries({ queryKey: ["niches"] });
  }

  return (
    <div>
      <PageHeader
        title="Niche Prompts"
        description="Prompt packs shown to every user on an active plan."
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Niche
          </Button>
        }
      />

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {(niches.data ?? []).map((n) => (
          <Card key={n.id} className="overflow-hidden p-0">
            <NicheImage path={n.image_path} alt={n.name} className="h-40 w-full" />
            <div className="p-5">
              <div className="flex items-center gap-2">
                <div className="font-medium">{n.name}</div>
                {!n.is_active && <Badge variant="secondary">Hidden</Badge>}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {n.prompt_text}
              </p>
              <div className="mt-4 flex justify-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(n);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(n)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {niches.data?.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground">No niches yet — add your first one.</Card>
        )}
      </div>

      <NicheDialog
        open={open}
        onOpenChange={setOpen}
        niche={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ["niches"] })}
      />
    </div>
  );
}

function NicheDialog({
  open,
  onOpenChange,
  niche,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  niche: Niche | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [sort, setSort] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(niche?.name ?? "");
    setPrompt(niche?.prompt_text ?? "");
    setSort(niche?.sort_order ?? 0);
    setIsActive(niche?.is_active ?? true);
    setFile(null);
  }, [open, niche]);

  async function save() {
    if (!name.trim() || !prompt.trim()) return toast.error("Name and prompt text are required");
    setSaving(true);
    try {
      let image_path = niche?.image_path ?? null;
      if (file) {
        image_path = await uploadNicheImage(file);
        if (niche?.image_path) await removeNicheImage(niche.image_path);
      }
      const payload = {
        name: name.trim(),
        prompt_text: prompt.trim(),
        sort_order: sort,
        is_active: isActive,
        image_path,
      };
      const { error } = niche
        ? await supabase.from("niches").update(payload).eq("id", niche.id)
        : await supabase.from("niches").insert(payload);
      if (error) throw new Error(error.message);
      toast.success(niche ? "Niche updated" : "Niche created");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border bg-card text-foreground">
        <DialogHeader>
          <DialogTitle>{niche ? "Edit Niche" : "Add Niche"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-4 overflow-auto">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-border" />
          </div>
          <div>
            <Label>Thumbnail</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="bg-background border-border"
            />
            {niche?.image_path && !file && (
              <NicheImage path={niche.image_path} alt={niche.name} className="mt-2 h-24 w-full rounded-lg" />
            )}
          </div>
          <div>
            <Label>Prompt Text</Label>
            <Textarea
              rows={7}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={sort}
              onChange={(e) => setSort(Number(e.target.value))}
              className="bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Visible to users</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
