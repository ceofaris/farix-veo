import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { StatCard } from "@/components/stat-card";
import { ArrowLeft, Plus, Pencil, Trash2, Users as UsersIcon, BadgeCheck, BadgeAlert, Wallet, Coins } from "lucide-react";
import { UserFormDialog, UserRow } from "@/components/user-form-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser, setAccountPaid } from "@/lib/admin.functions";
import { toast } from "sonner";
import { planExpired } from "@/lib/queries";
import { planName, type PlanId } from "@/lib/plans";
import { MarkPaidDialog, PayTarget, formatRs } from "@/components/mark-paid-dialog";
import { CreditsDialog, type CreditTarget } from "@/components/credits-dialog";
import { useCreditsFor, formatCredits } from "@/lib/credits";

export const Route = createFileRoute("/_authenticated/king/resellers_/$id")({
  component: KingResellerUsers,
  head: () => ({
    meta: [
      { title: "Reseller Detail | Farix King Panel" },
      { name: "description", content: "View a reseller's users, expiry and payment status." },
      { property: "og:title", content: "Reseller Detail | Farix King Panel" },
      { property: "og:description", content: "View a reseller's users, expiry and payment status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type PlanRow = { id: string; is_paid: boolean; paid_amount: number | null; expires_at: string; plan: PlanId };
type DetailUser = UserRow & { user_plans: PlanRow | PlanRow[] | null };

type Filter = "all" | "paid" | "unpaid" | "expired";

function planOf(u: DetailUser): PlanRow | null {
  const p = u.user_plans;
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

function KingResellerUsers() {
  const { id } = Route.useParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const [creditTarget, setCreditTarget] = useState<CreditTarget | null>(null);
  const del = useServerFn(deleteAuthUser);
  const markPaid = useServerFn(setAccountPaid);
  const qc = useQueryClient();

  function refreshEarnings() {
    users.refetch();
    qc.invalidateQueries({ queryKey: ["master-plans"] });
  }

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

  const users = useQuery({
    queryKey: ["reseller-users", id],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at, user_plans(id, plan, is_paid, paid_amount, expires_at)")
        .eq("role", "user")
        .eq("created_by", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DetailUser[];
    },
  });

  const rows = users.data ?? [];
  const creditsQuery = useCreditsFor(rows.map((u) => u.id));
  const creditsMap = creditsQuery.data ?? {};
  const filtered = rows.filter((u) => {
    const p = planOf(u);
    if (filter === "paid") return !!p?.is_paid;
    if (filter === "unpaid") return !p?.is_paid;
    if (filter === "expired") return planExpired(p?.expires_at);
    return true;
  });

  const paidCount = rows.filter((u) => planOf(u)?.is_paid).length;
  const totalEarned = rows.reduce((s, u) => {
    const p = planOf(u);
    return s + (p?.is_paid ? Number(p.paid_amount ?? 0) : 0);
  }, 0);

  async function handleDelete(uid: string) {
    if (!confirm("Delete this user?")) return;
    try {
      await del({ data: { id: uid } });
      toast.success("Deleted");
      refreshEarnings();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function unmarkPaid(planId: string) {
    try {
      await markPaid({ data: { id: planId, is_paid: false } });
      toast.success("Marked as unpaid");
      refreshEarnings();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "paid", label: "Paid" },
    { key: "unpaid", label: "Unpaid" },
    { key: "expired", label: "Expired" },
  ];

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
        description="Users belonging to this reseller — plan, expiry and payment status."
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={rows.length} icon={UsersIcon} tone="primary" />
        <StatCard label="Paid" value={paidCount} icon={BadgeCheck} tone="chart-2" />
        <StatCard label="Unpaid" value={rows.length - paidCount} icon={BadgeAlert} tone="chart-5" />
        <StatCard label="Total Earned" value={formatRs(totalEarned)} icon={Wallet} tone="chart-3" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground mr-1">Filter</span>
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <TableShell>
        <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
          <tr>
            <th className="px-5 py-3.5 font-semibold">User</th>
            <th className="px-5 py-3.5 font-semibold">Plan</th>
            <th className="px-5 py-3.5 font-semibold">Expiry</th>
            <th className="px-5 py-3.5 font-semibold">Payment</th>
            <th className="px-5 py-3.5 font-semibold">Credits</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => {
            const p = planOf(u);
            const expiry = p?.expires_at ?? u.expires_at;
            const expired = planExpired(expiry);
            return (
              <tr key={u.id} className="border-t border-border transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">
                  <div className="font-medium">{u.full_name || u.email}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-5 py-4">
                  <Badge variant={u.is_active && !expired ? "default" : "secondary"}>
                    {planName(p?.plan)} · {u.is_active && !expired ? "Active" : "Locked"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">
                  {expiry ? (
                    <span className={expired ? "font-medium text-rose-600" : undefined}>
                      {expired ? "Expired " : ""}
                      {new Date(expiry).toLocaleDateString()}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-4">
                  {p?.is_paid ? (
                    <span className="font-semibold text-emerald-600">
                      {formatRs(Number(p.paid_amount ?? 0))}
                    </span>
                  ) : (
                    <Badge variant="secondary">Unpaid</Badge>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <button
                    className="font-medium tabular-nums underline-offset-4 hover:underline"
                    onClick={() =>
                      setCreditTarget({
                        id: u.id,
                        name: u.full_name || u.email,
                        credits: creditsMap[u.id] ?? 0,
                      })
                    }
                  >
                    {formatCredits(creditsMap[u.id])}
                  </button>
                </td>
                <td className="px-5 py-4 text-right space-x-1 whitespace-nowrap">
                  {p && p.is_paid && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setPayTarget({
                            id: p.id,
                            name: u.full_name || u.email,
                            amount: p.paid_amount == null ? null : Number(p.paid_amount),
                            editing: true,
                          })
                        }
                      >
                        Edit Amount
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => unmarkPaid(p.id)}>
                        Mark Unpaid
                      </Button>
                    </>
                  )}
                  {p && !p.is_paid && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-400 text-amber-700 hover:bg-amber-50"
                      onClick={() => setPayTarget({ id: p.id, name: u.full_name || u.email })}
                    >
                      Mark as Paid
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing({ ...u, plan: p?.plan ?? null });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Manage credits"
                    onClick={() =>
                      setCreditTarget({
                        id: u.id,
                        name: u.full_name || u.email,
                        credits: creditsMap[u.id] ?? 0,
                      })
                    }
                  >
                    <Coins className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            );
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

      <CreditsDialog
        target={creditTarget}
        onOpenChange={(v) => !v && setCreditTarget(null)}
        onSaved={() => creditsQuery.refetch()}
      />

      <MarkPaidDialog
        target={payTarget}
        onOpenChange={(v) => !v && setPayTarget(null)}
        onSaved={refreshEarnings}
      />

      <UserFormDialog
        open={open}
        onOpenChange={setOpen}
        user={editing}
        ownerId={id}
        onSaved={refreshEarnings}
      />
    </div>
  );
}
