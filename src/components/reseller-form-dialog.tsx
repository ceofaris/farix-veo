import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { createReseller, updateReseller } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { activeToolsQuery } from "@/lib/queries";


export type ResellerRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  expires_at: string | null;
};

export function ResellerFormDialog({
  open,
  onOpenChange,
  reseller,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reseller: ResellerRow | null;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [days, setDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const create = useServerFn(createReseller);
  const update = useServerFn(updateReseller);
  const toolsQuery = useQuery({ ...activeToolsQuery, enabled: open });
  const tools = toolsQuery.data ?? [];

  useEffect(() => {
    if (!open) return;
    setEmail(reseller?.email ?? "");
    setPassword("");
    setFullName(reseller?.full_name ?? "");
    setDays(30);
    setIsActive(reseller?.is_active ?? true);
    setSelected(new Set());
    if (!reseller) return;
    let cancelled = false;
    (async () => {
      const { data: assigned } = await supabase
        .from("reseller_tools")
        .select("tool_id")
        .eq("reseller_id", reseller.id);
      if (!cancelled) setSelected(new Set((assigned ?? []).map((r) => r.tool_id as string)));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, reseller]);


  async function save() {
    setSaving(true);
    try {
      const tool_ids = Array.from(selected);
      if (reseller) {
        await update({ data: { id: reseller.id, full_name: fullName, days, tool_ids, is_active: isActive } });
      } else {
        await create({ data: { email, password, full_name: fullName, days, tool_ids, is_active: isActive } });
      }
      toast.success(reseller ? "Reseller updated" : "Reseller created");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function toggleTool(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>{reseller ? "Edit Reseller" : "Create Reseller"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background border-border" />
          </div>
          {!reseller && (
            <>
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background border-border" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="bg-background border-border" />
              </div>
            </>
          )}
          <div>
            <Label>Custom Days</Label>
            <Input type="number" min={0} value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-background border-border" />
          </div>
          <div>
            <Label>Tools Permission</Label>
            <div className="mt-2 space-y-2 border border-border rounded-lg p-3 bg-background">
              {tools.length === 0 && <p className="text-xs text-muted-foreground">No active tools yet.</p>}
              {tools.map((t) => (
                <label key={t.id} className="flex items-center gap-3 cursor-pointer">
                  <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleTool(t.id)} />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
