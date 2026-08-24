import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createReseller, updateReseller } from "@/lib/admin.functions";
import { PLANS, type PlanId } from "@/lib/plans";
import { useResellerPlans } from "@/hooks/use-allowed-plans";
import { cn } from "@/lib/utils";

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
  const [plans, setPlans] = useState<PlanId[]>(["master"]);
  const [saving, setSaving] = useState(false);
  const create = useServerFn(createReseller);
  const update = useServerFn(updateReseller);
  const qc = useQueryClient();
  const existingPlans = useResellerPlans(open && reseller ? reseller.id : null);

  useEffect(() => {
    if (!open) return;
    setEmail(reseller?.email ?? "");
    setPassword("");
    setFullName(reseller?.full_name ?? "");
    setDays(30);
    setIsActive(reseller?.is_active ?? true);
    setPlans(reseller ? [] : ["master"]);
  }, [open, reseller]);

  useEffect(() => {
    if (open && reseller && existingPlans.data) setPlans(existingPlans.data);
  }, [open, reseller, existingPlans.data]);

  function toggle(id: PlanId) {
    setPlans((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function save() {
    if (!plans.length) return toast.error("Assign at least one plan to this reseller");
    setSaving(true);
    try {
      if (reseller) {
        await update({ data: { id: reseller.id, full_name: fullName, days, is_active: isActive, plans } });
      } else {
        await create({ data: { email, password, full_name: fullName, days, is_active: isActive, plans } });
      }
      qc.invalidateQueries({ queryKey: ["reseller-plans"] });
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

          <div className="space-y-2">
            <Label>Plans this reseller can sell</Label>
            <div className="space-y-2">
              {PLANS.map((p) => {
                const checked = plans.includes(p.id);
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.features.join(" · ")}</div>
                    </div>
                  </button>
                );
              })}
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
