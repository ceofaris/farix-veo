import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { setAccountPaid } from "@/lib/admin.functions";
import { toast } from "sonner";

export type PayTarget = { id: string; name: string };

export function MarkPaidDialog({
  target,
  onOpenChange,
  onSaved,
}: {
  /** A single tool assignment (account) to record a payment for. */
  target: PayTarget | null;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const pay = useServerFn(setAccountPaid);


  useEffect(() => {
    if (target) setAmount("");
  }, [target]);

  const value = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(value) && value > 0;

  async function confirm() {
    if (!target || !valid) return;
    setSaving(true);
    try {
      await pay({ data: { id: target.id, is_paid: true, amount: value } });

      toast.success("Payment recorded");
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Payment</DialogTitle>
          <DialogDescription>{target?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="pay-amount">Amount received (Rs)</Label>
          <Input
            id="pay-amount"
            type="number"
            min={1}
            step="1"
            inputMode="decimal"
            value={amount}
            autoFocus
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) confirm();
            }}
            placeholder="e.g. 1500"
          />
          {amount.trim() !== "" && !valid && (
            <p className="text-xs text-destructive">Enter an amount greater than zero.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={!valid || saving}
            className="bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90"
          >
            {saving ? "Saving…" : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function formatRs(n: number) {
  return `Rs ${Math.round(n).toLocaleString()}`;
}
