import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { Plus, Pencil, Trash2, Users, ChevronRight, AlertTriangle, Search } from "lucide-react";
import { ResellerFormDialog, ResellerRow } from "@/components/reseller-form-dialog";
import { MarkPaidDialog, PayTarget, formatRs } from "@/components/mark-paid-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser, setAccountPaid } from "@/lib/admin.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/king/resellers")({
  component: KingResellers,
  head: () => ({
    meta: [
      { title: "Resellers & Earnings | Farix King Panel" },
      { name: "description", content: "Track reseller accounts, payments received and pending earnings." },
      { property: "og:title", content: "Resellers & Earnings | Farix King Panel" },
      { property: "og:description", content: "Track reseller accounts, payments received and pending earnings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type ResellerWithTools = ResellerRow & {
  reseller_tools: { tool_id: string; tools: { name: string } | null }[];
};

type AccountRow = {
  id: string; // user_tools.id
  created_at: string;
  expires_at: string | null;
  is_paid: boolean;
  paid_amount: number | null;
  paid_at: string | null;
  tools: { name: string } | null;
  profiles: { id: string; email: string; full_name: string | null; created_by: string | null } | null;
};


function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const AVATAR_TONES = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-rose-500",
];

function toneFor(id: string) {
  let h = 0;
  for (const c of id) h = (h + c.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[h]!;
}

function StatTile({
  label,
  value,
  hint,
  dot,
  hintTone = "muted",
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  dot: string;
  hintTone?: "muted" | "green" | "red";
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-card",
        highlight ? "border-violet-300/70 bg-violet-50/50 dark:bg-violet-500/5" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && (
        <div
          className={cn(
            "mt-1.5 text-xs font-medium",
            hintTone === "green" && "text-emerald-600",
            hintTone === "red" && "text-rose-600",
            hintTone === "muted" && "text-muted-foreground",
          )}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function KingResellers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ResellerRow | null>(null);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "paid" | "unpaid">("all");
  const [payTarget, setPayTarget] = useState<PayTarget | null>(null);
  const del = useServerFn(deleteAuthUser);
  const unpay = useServerFn(setAccountPaid);


  const resellers = useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at, reseller_tools(tool_id, tools(name))")
        .eq("role", "reseller")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ResellerWithTools[];
    },
  });

  const accounts = useQuery({
    queryKey: ["reseller-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tools")
        .select(
          "id, created_at, expires_at, is_paid, paid_amount, paid_at, tools(name), profiles!inner(id, email, full_name, created_by, role)",
        )
        .eq("profiles.role", "user")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AccountRow[];
    },
  });

  const rows = accounts.data ?? [];

  const byReseller = useMemo(() => {
    const map = new Map<string, AccountRow[]>();
    for (const a of rows) {
      const owner = a.profiles?.created_by;
      if (!owner) continue;
      const list = map.get(owner) ?? [];
      list.push(a);
      map.set(owner, list);
    }
    return map;
  }, [rows]);

  const totals = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let all = 0;
    let last30 = 0;
    let pendingCount = 0;
    const pendingResellers = new Set<string>();
    for (const a of rows) {
      if (a.is_paid) {
        all += Number(a.paid_amount ?? 0);
        if (a.paid_at && new Date(a.paid_at).getTime() >= cutoff) last30 += Number(a.paid_amount ?? 0);
      } else {
        pendingCount += 1;
        if (a.profiles?.created_by) pendingResellers.add(a.profiles.created_by);
      }
    }
    return { all, last30, pendingCount, pendingResellers: pendingResellers.size };
  }, [rows]);


  const activeResellers = (resellers.data ?? []).filter((r) => r.is_active).length;

  const filteredResellers = (resellers.data ?? []).filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.full_name ?? "").toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const activeReseller = (resellers.data ?? []).find((r) => r.id === activeId) ?? null;
  const activeAccounts = activeId ? byReseller.get(activeId) ?? [] : [];
  const activePaid = activeAccounts.filter((a) => a.is_paid);
  const activeEarned = activePaid.reduce((s, a) => s + Number(a.paid_amount ?? 0), 0);
  const drawerAccounts = activeAccounts.filter((a) =>
    tab === "all" ? true : tab === "paid" ? a.is_paid : !a.is_paid,
  );

  function refreshAll() {
    resellers.refetch();
    accounts.refetch();
  }

  async function unmarkPaid(id: string) {
    try {
      await unpay({ data: { id, is_paid: false } });
      toast.success("Marked as unpaid");
      refreshAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }


  async function handleDelete(id: string) {
    if (!confirm("Delete this reseller? This removes their account.")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      refreshAll();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Resellers"
        description="Every reseller you've onboarded — their accounts, payments, and earnings."
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-soft transition-transform hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Reseller
          </Button>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Total Earnings (All-time)"
          value={formatRs(totals.all)}
          hint="↑ From all resellers"
          hintTone="green"
          dot="bg-violet-500"
          highlight
        />
        <StatTile
          label="Last 30 Days"
          value={formatRs(totals.last30)}
          hint="Payments confirmed recently"
          dot="bg-emerald-500"
        />
        <StatTile
          label="Active Resellers"
          value={String(activeResellers)}
          hint="Right now"
          dot="bg-amber-500"
        />
        <StatTile
          label="Pending Payments"
          value={String(totals.pendingCount)}
          hint={`${totals.pendingCount} account${totals.pendingCount === 1 ? "" : "s"} unpaid`}
          hintTone="red"
          dot="bg-rose-500"
        />
      </div>

      {totals.pendingCount > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{totals.pendingCount} accounts</strong> across {totals.pendingResellers} reseller
            {totals.pendingResellers === 1 ? "" : "s"} still have pending payment.
          </span>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">All Resellers</h2>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resellers…"
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      <TableShell>
        <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
          <tr>
            <th className="px-5 py-3.5 font-semibold">Reseller</th>
            <th className="px-5 py-3.5 font-semibold">Accounts</th>
            <th className="px-5 py-3.5 font-semibold">Paid</th>
            <th className="px-5 py-3.5 font-semibold">Pending</th>
            <th className="px-5 py-3.5 font-semibold">Total Earned</th>
            <th className="px-5 py-3.5 font-semibold">Status</th>
            <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredResellers.map((r) => {
            const list = byReseller.get(r.id) ?? [];
            const paid = list.filter((a) => a.is_paid);
            const pending = list.length - paid.length;
            const earned = paid.reduce((s, a) => s + Number(a.paid_amount ?? 0), 0);
            const name = r.full_name || r.email;
            return (
              <tr
                key={r.id}
                onClick={() => {
                  setTab("all");
                  setActiveId(r.id);
                }}
                className="cursor-pointer border-t border-border transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
                        toneFor(r.id),
                      )}
                    >
                      {initials(name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.full_name || "—"}</div>
                      <div className="truncate text-xs text-muted-foreground">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">{list.length}</td>
                <td className="px-5 py-4">{paid.length}</td>
                <td className="px-5 py-4">
                  {pending > 0 ? (
                    <span className="font-medium text-amber-600">{pending} pending</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-4 font-semibold">{formatRs(earned)}</td>
                <td className="px-5 py-4">
                  <Badge variant={r.is_active ? "default" : "secondary"}>
                    {r.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/king/resellers/$id" params={{ id: r.id }} title="Manage users">
                      <Users className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <ChevronRight className="ml-1 inline h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            );
          })}
          {filteredResellers.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground">
                No resellers found.
              </td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <Sheet open={!!activeId} onOpenChange={(v) => !v && setActiveId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {activeReseller && (
            <>
              <SheetHeader className="space-y-0">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-semibold text-white",
                      toneFor(activeReseller.id),
                    )}
                  >
                    {initials(activeReseller.full_name || activeReseller.email)}
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{activeReseller.full_name || "Reseller"}</SheetTitle>
                    <SheetDescription className="truncate">{activeReseller.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <div className="text-xs text-muted-foreground">Total Accounts</div>
                  <div className="mt-1 text-2xl font-semibold">{activeAccounts.length}</div>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <div className="text-xs text-muted-foreground">Paid</div>
                  <div className="mt-1 text-2xl font-semibold text-emerald-600">{activePaid.length}</div>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <div className="text-xs text-muted-foreground">Pending</div>
                  <div className="mt-1 text-2xl font-semibold text-amber-600">
                    {activeAccounts.length - activePaid.length}
                  </div>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4">
                  <div className="text-xs text-muted-foreground">Total Earned</div>
                  <div className="mt-1 text-2xl font-semibold">{formatRs(activeEarned)}</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="inline-flex rounded-xl bg-muted p-1">
                  {(["all", "paid", "unpaid"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                        tab === t ? "bg-card shadow-soft" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/king/resellers/$id" params={{ id: activeReseller.id }}>
                    Manage users
                  </Link>
                </Button>
              </div>

              <div className="mt-4 space-y-3 pb-8">
                {drawerAccounts.map((a) => {
                  const tool = a.tools?.name ?? "No tool";
                  const person = a.profiles?.full_name || a.profiles?.email || "User";
                  const label = `${person} - ${tool}`;
                  const expired = !!a.expires_at && new Date(a.expires_at).getTime() < Date.now();
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-card"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{label}</div>
                        <div className="truncate text-xs text-muted-foreground">{a.profiles?.email}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            Added{" "}
                            {new Date(a.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {a.expires_at && (
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 font-medium",
                                expired
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {expired ? "Expired" : "Expires"}{" "}
                              {new Date(a.expires_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      {a.is_paid ? (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-semibold text-emerald-600">
                            {formatRs(Number(a.paid_amount ?? 0))}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => unmarkPaid(a.id)}>
                            Mark Unpaid
                          </Button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-medium text-rose-600">Unpaid</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-400 text-amber-700 hover:bg-amber-50"
                            onClick={() => setPayTarget({ id: a.id, name: label })}
                          >
                            Mark as Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {drawerAccounts.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    No accounts in this view.
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <MarkPaidDialog
        kind="account"
        target={payTarget}
        onOpenChange={(v) => !v && setPayTarget(null)}
        onSaved={refreshAll}
      />


      <ResellerFormDialog open={open} onOpenChange={setOpen} reseller={editing} onSaved={refreshAll} />
    </div>
  );
}
