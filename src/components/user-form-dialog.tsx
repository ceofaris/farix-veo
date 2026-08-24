import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { createEndUser, updateEndUser } from "@/lib/admin.functions";
import { useAllowedPlans } from "@/hooks/use-allowed-plans";
import { useResellerPlans } from "@/hooks/use-allowed-plans";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  expires_at: string | null;
  plan?: PlanId | null;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  ownerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
  /** When a king creates a user on behalf of a reseller. */
  ownerId?: string;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [days, setDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [plan, setPlan] = useState<PlanId>("master");
  const [saving, setSaving] = useState(false);
  const create = useServerFn(createEndUser);
  const update = useServerFn(updateEndUser);

  const mine = useAllowedPlans();
  const ownerPlans = useResellerPlans(open && ownerId ? ownerId : null);
  // A king creating for a reseller is limited to that reseller's plans.
  const allowedIds: PlanId[] = ownerId ? (ownerPlans.data ?? []) : mine.planIds;
  const options = PLANS.filter((p) => allowedIds.includes(p.id));

  useEffect(() => {
    if (!open) return;
    setEmail(user?.email ?? "");
    setPassword("");
    setFullName(user?.full_name ?? "");
    setDays(30);
    setIsActive(user?.is_active ?? true);
    setPlan(user?.plan ?? "master");
  }, [open, user]);

  useEffect(() => {
    if (!open || user) return;
    if (options.length && !allowedIds.includes(plan)) setPlan(options[0]!.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, allowedIds.join(",")]);

  async function save() {
    if (!allowedIds.includes(plan)) return toast.error("Select a plan you are allowed to sell");
    setSaving(true);
    try {
      if (user) {
        await update({ data: { id: user.id, full_name: fullName, days, is_active: isActive, plan } });
      } else {
        await create({
          data: { email, password, full_name: fullName, days, is_active: isActive, plan, owner_id: ownerId },
        });
      }
      toast.success(user ? "User updated" : "User created");
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
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-auto">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-background border-border" />
          </div>
          {!user && (
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
            {user && <p className="text-xs text-muted-foreground mt-1">Sets a new plan expiry from today.</p>}
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            {!options.length && (
              <p className="text-xs text-destructive">
                No plans assigned to you yet — ask the administrator to assign plans.
              </p>
            )}
            <div className="space-y-2">
              {options.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    plan === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                      plan === p.id ? "border-primary bg-primary" : "border-muted-foreground",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.features.join(" · ")}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label>Active</Label>
          </div>
          {!user && (
            <p className="text-xs text-muted-foreground">New users start as <strong>Unpaid</strong>.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !options.length}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
