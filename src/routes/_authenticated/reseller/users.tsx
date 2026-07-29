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

export const Route = createFileRoute("/_authenticated/reseller/users")({
  component: ResellerUsers,
});

type ResellerUserRow = UserRow & { is_paid: boolean };

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
        .select("id, email, full_name, is_active, is_paid, expires_at")
        .eq("role", "user")
        .eq("created_by", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ResellerUserRow[];
    },
  });

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

      <TableShell>
        <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
          <tr>
            <th className="px-5 py-3.5 font-semibold">Name</th>
            <th className="px-5 py-3.5 font-semibold">Email</th>
            <th className="px-5 py-3.5 font-semibold">Tool</th>
            <th className="px-5 py-3.5 font-semibold">Expiry</th>
            <th className="px-5 py-3.5 font-semibold">Payment</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.data?.map((u) => (
            <tr key={u.id} className="border-t border-border transition-colors hover:bg-muted/40">
              <td className="px-5 py-4">{u.full_name || <span className="text-muted-foreground">—</span>}</td>
              <td className="px-5 py-4 text-foreground/80">{u.email}</td>
              <td className="px-5 py-4 text-xs text-muted-foreground">
                {u.user_tools?.length
                  ? u.user_tools.map((t) => toolMap.get(t.tool_id) ?? "—").join(", ")
                  : "—"}
              </td>
              <td className="px-5 py-4 text-muted-foreground">
                {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-5 py-4">
                <Badge variant={u.is_paid ? "default" : "secondary"}>{u.is_paid ? "Paid" : "Unpaid"}</Badge>
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
              <td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">
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
        onSaved={() => users.refetch()}
      />
    </div>
  );
}
