import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings, type AppSettings } from "@/hooks/use-app-settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/king/settings")({
  component: KingSettings,
});

function KingSettings() {
  const { settings, loading } = useAppSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) setForm(settings);
  }, [loading, settings]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .update({
        public_signup_enabled: form.public_signup_enabled,
        google_only_signup: form.google_only_signup,
        trial_minutes: Math.max(1, Math.min(10080, Number(form.trial_minutes) || 60)),
        max_login_ips: Math.max(1, Math.min(20, Number(form.max_login_ips) || 3)),
        support_phone: form.support_phone.trim(),
      })
      .eq("id", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["app-settings"] });
    toast.success("Settings saved");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Platform Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signup, free trial and anti-abuse rules. All of these are enforced server-side.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">Public signup</div>
            <p className="text-xs text-muted-foreground">
              Turn off to stop all new self-signups instantly (invites keep working).
            </p>
          </div>
          <Switch
            checked={form.public_signup_enabled}
            onCheckedChange={(v) => setForm({ ...form, public_signup_enabled: v })}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
          <div>
            <div className="font-medium">Google-only signup</div>
            <p className="text-xs text-muted-foreground">
              Only verified Google accounts can register. Blocks fake / temp emails completely.
            </p>
          </div>
          <Switch
            checked={form.google_only_signup}
            onCheckedChange={(v) => setForm({ ...form, google_only_signup: v })}
          />
        </div>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="trial">Free trial length (minutes)</Label>
            <Input
              id="trial"
              type="number"
              min={1}
              value={form.trial_minutes}
              onChange={(e) => setForm({ ...form, trial_minutes: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="ips">Max IPs before suspension</Label>
            <Input
              id="ips"
              type="number"
              min={1}
              value={form.max_login_ips}
              onChange={(e) => setForm({ ...form, max_login_ips: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="phone">Support number (shown on expired / suspended screens)</Label>
            <Input
              id="phone"
              value={form.support_phone}
              onChange={(e) => setForm({ ...form, support_phone: e.target.value })}
              placeholder="+92 300 0000000"
            />
          </div>
        </div>

        <Button onClick={save} disabled={saving || loading} className="w-full sm:w-auto">
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  );
}
