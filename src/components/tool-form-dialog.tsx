import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { uploadToolLogo } from "@/lib/logo";
import { toast } from "sonner";

export type ToolRow = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo_url: string | null;
  is_active: boolean;
};

export function ToolFormDialog({
  open,
  onOpenChange,
  tool,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tool: ToolRow | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(tool?.name ?? "");
      setDomain(tool?.domain ?? "");
      setIsActive(tool?.is_active ?? true);
      setFile(null);
    }
  }, [open, tool]);

  async function save() {
    setSaving(true);
    try {
      let logo_url = tool?.logo_url ?? null;
      if (file) logo_url = await uploadToolLogo(file);
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (tool) {
        const { error } = await supabase
          .from("tools")
          .update({ name, domain, is_active: isActive, logo_url })
          .eq("id", tool.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tools").insert({
          name,
          domain,
          is_active: isActive,
          logo_url,
          slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        });
        if (error) throw error;
      }
      toast.success(tool ? "Tool updated" : "Tool created");
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
      <DialogContent className="bg-neutral-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{tool ? "Edit Tool" : "Add New Tool"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tool Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-neutral-950 border-white/10" />
          </div>
          <div>
            <Label>Domain</Label>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="bg-neutral-950 border-white/10"
            />
          </div>
          <div>
            <Label>Logo (image upload)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="bg-neutral-950 border-white/10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || !name || !domain}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
