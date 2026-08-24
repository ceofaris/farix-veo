import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { Plus, Pencil, Trash2, Users, ChevronRight, AlertTriangle, Search } from "lucide-react";
import { ResellerFormDialog, ResellerRow } from "@/components/reseller-form-dialog";
import { formatRs } from "@/components/mark-paid-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser, setResellerActive } from "@/lib/admin.functions";
import { Switch } from "@/components/ui/switch";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { masterPlansQuery, summarizeEarnings, MasterPlan } from "@/lib/queries";

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

type AccountRow = MasterPlan;


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
  const navigate = useNavigate();
  const del = useServerFn(deleteAuthUser);
  const setActive = useServerFn(setResellerActive);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(r: ResellerRow, next: boolean) {
    setToggling(r.id);
    try {
      await setActive({ data: { id: r.id, is_active: next } });
      toast.success(next ? "Reseller enabled" : "Reseller disabled — they can no longer log in");
      await resellers.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setToggling(null);
    }
  }





  const resellers = useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at")
        .eq("role", "reseller")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ResellerRow[];
    },
  });

  const accounts = useQuery(masterPlansQuery);

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

  const totals = useMemo(() => summarizeEarnings(rows), [rows]);

  const activeResellers = (resellers.data ?? []).filter((r) => r.is_active).length;

  const filteredResellers = (resellers.data ?? []).filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (r.full_name ?? "").toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  function refreshAll() {
    resellers.refetch();
    accounts.refetch();
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
            <th className="px-5 py-3.5 font-semibold">Master Plans</th>
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
                onClick={() => navigate({ to: "/king/resellers/$id", params: { id: r.id } })}
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
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2.5">
                    <Switch
                      checked={r.is_active}
                      disabled={toggling === r.id}
                      onCheckedChange={(v) => handleToggle(r, v)}
                      aria-label={r.is_active ? "Disable reseller" : "Enable reseller"}
                    />
                    <Badge variant={r.is_active ? "default" : "secondary"}>
                      {r.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
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





      <ResellerFormDialog open={open} onOpenChange={setOpen} reseller={editing} onSaved={refreshAll} />
    </div>
  );
}
