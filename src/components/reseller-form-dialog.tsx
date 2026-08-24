import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createReseller, updateReseller } from "@/lib/admin.functions";
import { MASTER_PLAN } from "@/lib/queries";

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
  const [saving, setSaving] = useState(false);
  const create = useServerFn(createReseller);
  const update = useServerFn(updateReseller);

  useEffect(() => {
    if (!open) return;
    setEmail(reseller?.email ?? "");
    setPassword("");
    setFullName(reseller?.full_name ?? "");
    setDays(30);
    setIsActive(reseller?.is_active ?? true);
  }, [open, reseller]);

  async function save() {
    setSaving(true);
    try {
      if (reseller) {
        await update({ data: { id: reseller.id, full_name: fullName, days, is_active: isActive } });
      } else {
        await create({ data: { email, password, full_name: fullName, days, is_active: isActive } });
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
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="text-sm font-medium">{MASTER_PLAN.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Resellers sell the Master plan only — it includes {MASTER_PLAN.features.join(", ")}.
            </p>
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
