import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ToolAccountRow = {
  id: string;
  tool_id: string;
  label: string | null;
  cookie_data: string;
  is_active: boolean;
  notes: string | null;
};

export function AccountFormDialog({
  open,
  onOpenChange,
  toolId,
  account,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  toolId: string;
  account: ToolAccountRow | null;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState("");
  const [cookieData, setCookieData] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel(account?.label ?? "");
      setCookieData(account?.cookie_data ?? "");
      setNotes(account?.notes ?? "");
      setIsActive(account?.is_active ?? true);
    }
  }, [open, account]);

  async function save() {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (account) {
        const { error } = await supabase
          .from("tool_accounts")
          .update({ label, cookie_data: cookieData, notes, is_active: isActive })
          .eq("id", account.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tool_accounts").insert({
          tool_id: toolId,
          label,
          cookie_data: cookieData,
          notes,
          is_active: isActive,
          created_by: user.user?.id ?? null,
        });
        if (error) throw error;
      }
      toast.success(account ? "Account updated" : "Account created");
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
      <DialogContent className="bg-card border-border text-foreground max-w-2xl">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Label (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-background border-border" />
          </div>
          <div>
            <Label>Cookie Data</Label>
            <Textarea
              value={cookieData}
              onChange={(e) => setCookieData(e.target.value)}
              rows={8}
              className="bg-background border-border font-mono text-xs"
              placeholder="Paste raw cookie JSON or string…"
            />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !cookieData}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
