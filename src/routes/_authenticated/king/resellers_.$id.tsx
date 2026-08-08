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
import { MarkPaidDialog, PayTarget, formatRs } from "@/components/mark-paid-dialog";


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
  user_tools: {
    id: string;
    tool_id: string;
    is_paid: boolean;
    paid_amount: number | null;
    expires_at: string | null;
  }[];
};


function KingResellerUsers() {
  const { id } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
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
        .select(
          "id, email, full_name, is_active, expires_at, user_tools(id, tool_id, is_paid, paid_amount, expires_at)",
        )
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
  const allAccounts = rows.flatMap((u) => u.user_tools ?? []);
  const paidCount = allAccounts.filter((a) => a.is_paid).length;

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

  async function unmarkPaid(accountId: string) {
    try {
      await markPaid({ data: { id: accountId, is_paid: false } });
      toast.success("Marked as unpaid");
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
        <StatCard label="Total Accounts" value={allAccounts.length} icon={UsersIcon} tone="primary" />
        <StatCard label="Paid Accounts" value={paidCount} icon={BadgeCheck} tone="chart-2" />
        <StatCard
          label="Unpaid Accounts"
          value={allAccounts.length - paidCount}
          icon={BadgeAlert}
          tone="chart-5"
        />
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
            <th className="px-5 py-3.5 font-semibold">Account</th>
            <th className="px-5 py-3.5 font-semibold">Expiry</th>
            <th className="px-5 py-3.5 font-semibold">Payment</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.flatMap((u) => {
            const accounts = (u.user_tools ?? []).filter(
              (a) => toolFilter === "all" || a.tool_id === toolFilter,
            );
            if (accounts.length === 0) {
              return [
                <tr key={u.id} className="border-t border-border transition-colors hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="font-medium">{u.full_name || u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">—</td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">No tools assigned</td>
                  <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
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
                </tr>,
              ];
            }
            return accounts.map((a) => {
              const toolName = toolMap.get(a.tool_id) ?? "—";
              const expired = !!a.expires_at && new Date(a.expires_at).getTime() < Date.now();
              return (
                <tr key={a.id} className="border-t border-border transition-colors hover:bg-muted/40">
                  <td className="px-5 py-4">
                    <div className="font-medium">
                      {u.full_name || u.email} - {toolName}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {a.expires_at ? (
                      <span className={expired ? "font-medium text-rose-600" : undefined}>
                        {expired ? "Expired " : ""}
                        {new Date(a.expires_at).toLocaleDateString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {a.is_paid ? (
                      <span className="font-semibold text-emerald-600">
                        {formatRs(Number(a.paid_amount ?? 0))}
                      </span>
                    ) : (
                      <Badge variant="secondary">Unpaid</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                    {a.is_paid ? (
                      <Button size="sm" variant="ghost" onClick={() => unmarkPaid(a.id)}>
                        Mark Unpaid
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-400 text-amber-700 hover:bg-amber-50"
                        onClick={() =>
                          setPayTarget({ id: a.id, name: `${u.full_name || u.email} - ${toolName}` })
                        }
                      >
                        Mark as Paid
                      </Button>
                    )}
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
              );
            });
          })}

          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">
                No users match this filter.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <MarkPaidDialog
        target={payTarget}
        onOpenChange={(v) => !v && setPayTarget(null)}
        onSaved={() => users.refetch()}
      />

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
