import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { UserFormDialog, UserRow } from "@/components/user-form-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/resellers_/$id")({
  component: KingResellerUsers,
});

function KingResellerUsers() {
  const { id } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const del = useServerFn(deleteAuthUser);

  const reseller = useQuery({
    queryKey: ["reseller", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const users = useQuery({
    queryKey: ["reseller-users", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at")
        .eq("role", "user")
        .eq("created_by", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserRow[];
    },
  });

  async function handleDelete(uid: string) {
    if (!confirm("Delete this user?")) return;
    try {
      await del({ data: { id: uid } });
      toast.success("Deleted");
      users.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <Link
        to="/king/resellers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Back to resellers
      </Link>

      <PageHeader
        title={reseller.data?.full_name || reseller.data?.email || "Reseller"}
        description="Users belonging to this reseller."
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
              <td colSpan={5} className="px-5 py-14 text-center text-muted-foreground">
                No users under this reseller yet.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <UserFormDialog
        open={open}
        onOpenChange={setOpen}
        user={editing}
        ownerId={id}
        onSaved={() => users.refetch()}
      />
    </div>
  );
}
