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
import { createEndUser, updateEndUser } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { activeToolsQuery, resellerToolIdsQuery, isVeo, DEFAULT_VEO_CREDITS } from "@/lib/queries";

export type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  expires_at: string | null;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  ownerId,
  hideTools = false,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null;
  ownerId?: string;
  /** Hide tool selection (reseller view) — the owner's tools are assigned automatically. */
  hideTools?: boolean;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [days, setDays] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [veoCredits, setVeoCredits] = useState(DEFAULT_VEO_CREDITS);
  const [existingVeo, setExistingVeo] = useState(false);
  const create = useServerFn(createEndUser);
  const update = useServerFn(updateEndUser);

  const allTools = useQuery({ ...activeToolsQuery, enabled: open });
  const ownerToolIds = useQuery({ ...resellerToolIdsQuery(ownerId), enabled: open && !!ownerId });

  const tools = ownerId
    ? (allTools.data ?? []).filter((t) => (ownerToolIds.data ?? []).includes(t.id))
    : (allTools.data ?? []);

  useEffect(() => {
    if (!open) return;
    setEmail(user?.email ?? "");
    setPassword("");
    setFullName(user?.full_name ?? "");
    setDays(30);
    setIsActive(user?.is_active ?? true);
    setSelected(new Set());
    setVeoCredits(DEFAULT_VEO_CREDITS);
    setExistingVeo(false);
    if (user) {
      let cancelled = false;
      (async () => {
        const { data } = await supabase
          .from("user_tools")
          .select("tool_id, credits, tools(slug, name)")
          .eq("user_id", user.id);
        if (cancelled) return;
        setSelected(new Set((data ?? []).map((r) => r.tool_id as string)));
        const veoRow = (data ?? []).find((r) => isVeo(r.tools as { slug: string; name: string } | null));
        setExistingVeo(!!veoRow);
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [open, user]);

  const veoTool = (allTools.data ?? []).find((t) => isVeo(t));
  const effectiveIds = hideTools ? (ownerToolIds.data ?? []) : Array.from(selected);
  const veoSelected = !!veoTool && effectiveIds.includes(veoTool.id) && !existingVeo;

  function toggleTool(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function save() {
    setSaving(true);
    try {
      const tool_ids = hideTools ? (ownerToolIds.data ?? []) : Array.from(selected);
      const veo_credits = veoCredits;
      if (user) {
        await update({ data: { id: user.id, full_name: fullName, days, is_active: isActive, tool_ids, veo_credits } });
      } else {
        await create({
          data: { email, password, full_name: fullName, days, is_active: isActive, owner_id: ownerId, tool_ids, veo_credits },
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
            {user && <p className="text-xs text-muted-foreground mt-1">Sets a new expiry from today.</p>}
          </div>
          {!hideTools && (
            <div>
              <Label>Tools Access</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                The user only sees extensions for the tools selected here.
              </p>
              <div className="mt-2 space-y-2 border border-border rounded-lg p-3 bg-background">
                {tools.length === 0 && <p className="text-xs text-muted-foreground">No tools available.</p>}
                {tools.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 cursor-pointer">
                    <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleTool(t.id)} />
                    <span className="text-sm">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {veoSelected && (
            <div>
              <Label>Veo 3 Credits</Label>
              <Input
                type="number"
                min={0}
                step={30}
                value={veoCredits}
                onChange={(e) => setVeoCredits(Number(e.target.value))}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Applied when Veo 3 access is first granted (default 45,000). Each video costs 30
                credits. ChatGPT is unlimited.
              </p>
            </div>
          )}
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
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
