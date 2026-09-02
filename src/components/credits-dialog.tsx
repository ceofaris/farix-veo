import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  adjustUserCredits,
  setUserCredits,
  formatCredits,
  TEST_USER_CREDITS,
  PAID_USER_CREDITS,
} from "@/lib/credits";

export type CreditTarget = { id: string; name: string; credits: number };

/** King-only credit management: set an absolute balance, or add/subtract. */
export function CreditsDialog({
  target,
  onOpenChange,
  onSaved,
}: {
  target: CreditTarget | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [delta, setDelta] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (target) {
      setValue(String(target.credits ?? 0));
      setDelta("");
    }
  }, [target]);

  async function run(fn: () => Promise<void>) {
    if (!target) return;
    setSaving(true);
    try {
      await fn();
      toast.success("Credits updated");
      onOpenChange(false);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const absolute = Number(value);
  const validAbsolute = value.trim() !== "" && Number.isFinite(absolute) && absolute >= 0;
  const change = Number(delta);
  const validDelta = delta.trim() !== "" && Number.isFinite(change) && change !== 0;

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Manage Credits</DialogTitle>
          <DialogDescription>
            {target?.name} — currently {formatCredits(target?.credits)} credits (30 per Veo video)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credits-abs">Set balance to</Label>
            <Input
              id="credits-abs"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setValue(String(TEST_USER_CREDITS))}
              >
                Test — 500
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setValue(String(PAID_USER_CREDITS))}
              >
                Paid — 45,000
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="credits-delta">Or add / subtract (use a minus sign to subtract)</Label>
            <div className="flex gap-2">
              <Input
                id="credits-delta"
                inputMode="numeric"
                placeholder="e.g. 300 or -300"
                value={delta}
                onChange={(e) => setDelta(e.target.value.replace(/[^\d-]/g, ""))}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!validDelta || saving}
                onClick={() => run(() => adjustUserCredits(target!.id, change))}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            disabled={!validAbsolute || saving}
            onClick={() => run(() => setUserCredits(target!.id, absolute))}
          >
            Save balance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
