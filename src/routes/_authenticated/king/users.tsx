
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { UserFormDialog, UserRow } from "@/components/user-form-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/users")({
  component: KingUsers,
});

function KingUsers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const del = useServerFn(deleteAuthUser);

  const users = useQuery({
    queryKey: ["end-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at")
        .eq("role", "user")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRow[];
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage end users of the platform.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Create User
        </Button>
      </div>

      <div className="mt-6 border border-border rounded-xl bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Name</th>
              <th className="px-5 py-3.5 font-semibold">Email</th>
              <th className="px-5 py-3.5 font-semibold">Expires</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-t border-border transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">{u.full_name || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-5 py-4 text-foreground/80">{u.email}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-5 py-4 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {users.data?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-14 text-center text-muted-foreground">No users.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <UserFormDialog open={open} onOpenChange={setOpen} user={editing} onSaved={() => users.refetch()} />
    </div>
  );
}
