import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { reactivateUser } from "@/lib/public-auth.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/king/suspended")({
  component: SuspendedUsersPage,
});

type Row = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  signup_source: string | null;
  trial_ends_at: string | null;
  created_at: string;
};

function SuspendedUsersPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["king-suspended-users"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, status, signup_source, trial_ends_at, created_at")
        .eq("status", "suspended")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function reactivate(id: string) {
    try {
      await reactivateUser({ data: { id } });
      toast.success("Account reactivated");
      qc.invalidateQueries({ queryKey: ["king-suspended-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reactivate");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Suspended accounts</h1>
          <p className="text-sm text-muted-foreground">
            Accounts locked after logging in from more than 3 different IPs.
          </p>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card shadow-soft">
        {q.isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No suspended accounts right now.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(q.data ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.signup_source ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" onClick={() => reactivate(u.id)}>
                      <ShieldCheck className="mr-1.5 h-4 w-4" /> Reactivate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
