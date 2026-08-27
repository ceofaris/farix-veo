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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pktDayKey, type Investment } from "@/lib/king-analytics";

export function InvestmentDialog({
  open,
  onOpenChange,
  investment,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  investment?: Investment | null;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [spentOn, setSpentOn] = useState(pktDayKey(Date.now()));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLabel(investment?.label ?? "");
    setAmount(investment ? String(investment.amount) : "");
    setSpentOn(investment?.spent_on ?? pktDayKey(Date.now()));
    setNote(investment?.note ?? "");
  }, [open, investment]);

  const value = Number(amount);
  const valid = label.trim() !== "" && Number.isFinite(value) && value > 0 && !!spentOn;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      const payload = {
        label: label.trim(),
        amount: value,
        spent_on: spentOn,
        note: note.trim() || null,
      };
      const { error } = investment
        ? await supabase.from("investments").update(payload).eq("id", investment.id)
        : await supabase.from("investments").insert(payload);
      if (error) throw error;
      toast.success(investment ? "Investment updated" : "Investment added");
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
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{investment ? "Edit Investment" : "Add Investment"}</DialogTitle>
          <DialogDescription>Track monthly platform costs like accounts or servers.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-label">Label</Label>
            <Input
              id="inv-label"
              value={label}
              autoFocus
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. ChatGPT accounts"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">Amount (Rs)</Label>
              <Input
                id="inv-amount"
                type="number"
                min={1}
                step="1"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-date">Date</Label>
              <Input
                id="inv-date"
                type="date"
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-note">Note (optional)</Label>
            <Input
              id="inv-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth remembering"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={!valid || saving}
            className="bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90"
          >
            {saving ? "Saving…" : investment ? "Save" : "Add Investment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
