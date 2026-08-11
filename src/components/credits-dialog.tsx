import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCredits } from "@/lib/queries";

export type CreditsTarget = {
  userId: string;
  name: string;
  credits: number;
  used: number;
  mode: "add" | "set";
};

/** Add or set Veo 3 credits for a single user (King / owning Reseller). */
export function CreditsDialog({
  target,
  onOpenChange,
  onSaved,
}: {
  target: CreditsTarget | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) setAmount(target.mode === "set" ? String(target.credits) : "");
  }, [target]);

  async function save() {
    if (!target) return;
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0 || (target.mode === "add" && value <= 0)) {
      toast.error("Enter a valid credit amount.");
      return;
    }
    setSaving(true);
    try {
      const fn = target.mode === "add" ? "add_credits" : "set_credits";
      const { error } = await supabase.rpc(fn, {
        _user_id: target.userId,
        _amount: Math.round(value),
      });
      if (error) throw new Error(error.message);
      toast.success(target.mode === "add" ? "Credits added" : "Credits updated");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {target?.mode === "add" ? "Add Veo 3 Credits" : "Set Veo 3 Credits"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {target?.name} — currently{" "}
            <strong className="text-foreground">{formatCredits(target?.credits ?? 0)}</strong> remaining
            {" · "}
            {formatCredits(target?.used ?? 0)} used
          </p>
          <div>
            <Label>{target?.mode === "add" ? "Credits to add" : "Remaining credits"}</Label>
            <Input
              type="number"
              min={0}
              step={30}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 45000"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">Each video generation costs 30 credits.</p>
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
