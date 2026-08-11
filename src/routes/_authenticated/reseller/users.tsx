import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { UserFormDialog, UserRow } from "@/components/user-form-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser } from "@/lib/admin.functions";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { isVeo, formatCredits, creditUsageThisMonthQuery } from "@/lib/queries";
import { StatCard } from "@/components/stat-card";
import { Coins, Activity, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reseller/users")({
  component: ResellerUsers,
});

type ResellerUserRow = UserRow & {
  user_tools: {
    is_paid: boolean;
    credits: number;
    total_credits: number;
    credits_used: number;
    tools: { slug: string; name: string } | null;
  }[];
};

function ResellerUsers() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const del = useServerFn(deleteAuthUser);

  const users = useQuery({
    queryKey: ["reseller-users", profile?.id],
    enabled: !!profile,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at, user_tools(is_paid, credits, total_credits, credits_used, tools(slug, name))")
        .eq("role", "user")
        .eq("created_by", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ResellerUserRow[];
    },
  });


  const usage = useQuery(creditUsageThisMonthQuery);

  const veoRows = (users.data ?? []).flatMap((u) => (u.user_tools ?? []).filter((a) => isVeo(a.tools)));
  const given = veoRows.reduce((s, a) => s + Number(a.total_credits ?? 0), 0);
  const left = veoRows.reduce((s, a) => s + Number(a.credits ?? 0), 0);
  const usedMonth = (usage.data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      users.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        title="My Users"
        description="Users you have created. Payment status is set by the admin."
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="shadow-soft transition-transform active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create User
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard
          icon={Coins}
          label="Veo Credits Given"
          value={formatCredits(given)}
          hint={`${formatCredits(left)} remaining`}
          tone="primary"
        />
        <StatCard
          icon={Activity}
          label="Credits Used (This Month)"
          value={usage.isSuccess ? formatCredits(usedMonth) : "—"}
          hint="30 credits per video"
          tone="chart-2"
        />
        <StatCard
          icon={Video}
          label="Users with Veo 3"
          value={veoRows.length}
          hint="ChatGPT is unlimited"
          tone="chart-3"
        />
      </div>

      <TableShell>
        <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
          <tr>
            <th className="px-5 py-3.5 font-semibold">Name</th>
            <th className="px-5 py-3.5 font-semibold">Email</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold">Expiry</th>
            <th className="px-5 py-3.5 font-semibold">Veo Credits</th>
            <th className="px-5 py-3.5 font-semibold">Payment</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.data?.map((u) => (
            <tr key={u.id} className="border-t border-border transition-colors hover:bg-muted/40">
              <td className="px-5 py-4">{u.full_name || <span className="text-muted-foreground">—</span>}</td>
              <td className="px-5 py-4 text-foreground/80">{u.email}</td>
              <td className="px-5 py-4">
                <Badge variant={u.is_active ? "default" : "secondary"}>
                  {u.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-5 py-4 text-sm">
                {(() => {
                  const veo = (u.user_tools ?? []).find((a) => isVeo(a.tools));
                  if (!veo) return <span className="text-xs text-muted-foreground">No Veo 3</span>;
                  return (
                    <div>
                      <div className="font-medium">{formatCredits(veo.credits)} left</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCredits(veo.credits_used)} used of {formatCredits(veo.total_credits)}
                      </div>
                    </div>
                  );
                })()}
              </td>
              <td className="px-5 py-4">
                {(() => {
                  const accounts = u.user_tools ?? [];
                  const paid = accounts.filter((a) => a.is_paid).length;
                  if (accounts.length === 0)
                    return <span className="text-xs text-muted-foreground">No tools</span>;
                  return (
                    <Badge variant={paid === accounts.length ? "default" : "secondary"}>
                      {paid}/{accounts.length} paid
                    </Badge>
                  );
                })()}
              </td>

              <td className="px-5 py-4 text-right space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(u);
                    setOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
          {users.data?.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground">
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <UserFormDialog
        open={open}
        onOpenChange={setOpen}
        user={editing}
        ownerId={profile?.id}
        hideTools
        onSaved={() => users.refetch()}
      />

    </div>
  );
}
