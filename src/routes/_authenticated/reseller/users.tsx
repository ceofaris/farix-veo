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
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/reseller/users")({
  component: ResellerUsers,
});

function ResellerUsers() {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const del = useServerFn(deleteAuthUser);

  const users = useQuery({
    queryKey: ["reseller-users", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at")
        .eq("role", "user")
        .eq("created_by", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRow[];
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); users.refetch(); }
    catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Users</h1>
          <p className="text-neutral-400 text-sm mt-1">Users you have created.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Create User
        </Button>
      </div>

      <div className="mt-6 border border-white/10 rounded-xl bg-neutral-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-3">{u.full_name || <span className="text-neutral-500">—</span>}</td>
                <td className="px-4 py-3 text-neutral-300">{u.email}</td>
                <td className="px-4 py-3 text-neutral-400">{u.expires_at ? new Date(u.expires_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3"><Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Inactive"}</Badge></td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}><Trash2 className="w-4 h-4" /></Button>
                </td>
              </tr>
            ))}
            {users.data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <UserFormDialog open={open} onOpenChange={setOpen} user={editing} onSaved={() => users.refetch()} />
    </div>
  );
}
