import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { StatCard } from "@/components/stat-card";
import { ArrowLeft, Plus, Pencil, Trash2, Users as UsersIcon, BadgeCheck, BadgeAlert } from "lucide-react";
import { UserFormDialog, UserRow } from "@/components/user-form-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser, setUserPaid } from "@/lib/admin.functions";
import { toast } from "sonner";
import { activeToolsQuery, resellerToolIdsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/king/resellers_/$id")({
  component: KingResellerUsers,
  head: () => ({
    meta: [
      { title: "Reseller Detail | Farix King Panel" },
      { name: "description", content: "View a reseller's users, payment status and tool access." },
      { property: "og:title", content: "Reseller Detail | Farix King Panel" },
      { property: "og:description", content: "View a reseller's users, payment status and tool access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type DetailUser = UserRow & {
  is_paid: boolean;
  user_tools: { tool_id: string }[];
};

function KingResellerUsers() {
  const { id } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [toolFilter, setToolFilter] = useState<string>("all");
  const del = useServerFn(deleteAuthUser);
  const markPaid = useServerFn(setUserPaid);

  const reseller = useQuery({
    queryKey: ["reseller", id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const allTools = useQuery(activeToolsQuery);
  const assignedIds = useQuery(resellerToolIdsQuery(id));
  const toolMap = useMemo(
    () => new Map((allTools.data ?? []).map((t) => [t.id, t.name])),
    [allTools.data],
  );
  const filterTools = (allTools.data ?? []).filter((t) => (assignedIds.data ?? []).includes(t.id));

  const users = useQuery({
    queryKey: ["reseller-users", id],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, is_paid, expires_at, user_tools(tool_id)")
        .eq("role", "user")
        .eq("created_by", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DetailUser[];
    },
  });

  const rows = users.data ?? [];
  const filtered =
    toolFilter === "all" ? rows : rows.filter((u) => u.user_tools?.some((t) => t.tool_id === toolFilter));
  const paidCount = rows.filter((u) => u.is_paid).length;

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

  async function togglePaid(u: DetailUser) {
    try {
      await markPaid({ data: { id: u.id, is_paid: !u.is_paid } });
      toast.success(u.is_paid ? "Marked as unpaid" : "Marked as paid");
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

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={rows.length} icon={UsersIcon} tone="blue" />
        <StatCard label="Paid Users" value={paidCount} icon={BadgeCheck} tone="green" />
        <StatCard label="Unpaid Users" value={rows.length - paidCount} icon={BadgeAlert} tone="amber" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground mr-1">Filter</span>
        <Button
          size="sm"
          variant={toolFilter === "all" ? "default" : "outline"}
          onClick={() => setToolFilter("all")}
        >
          All Tools
        </Button>
        {filterTools.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={toolFilter === t.id ? "default" : "outline"}
            onClick={() => setToolFilter(t.id)}
          >
            {t.name}
          </Button>
        ))}
      </div>

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
          {filtered.map((u) => (
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
              <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                <Button size="sm" variant={u.is_paid ? "ghost" : "default"} onClick={() => togglePaid(u)}>
                  {u.is_paid ? "Mark Unpaid" : "Mark as Paid"}
                </Button>
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
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">
                No users match this filter.
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
