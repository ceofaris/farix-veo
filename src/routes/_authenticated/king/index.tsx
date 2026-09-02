import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/panel-layout";
import { Button } from "@/components/ui/button";
import { ToolLogo } from "@/components/tool-logo";
import { formatRs } from "@/components/mark-paid-dialog";
import { InvestmentDialog } from "@/components/investment-dialog";
import { activeToolsQuery, masterPlansQuery, summarizeEarnings } from "@/lib/queries";
import { planIncludes, planName } from "@/lib/plans";
import {
  investmentsQuery,
  kingProfilesQuery,
  lastPktDays,
  pktDayKey,
  pktDayLabel,
  pktMonthKey,
  toolAccountsQuery,
  type Investment,
} from "@/lib/king-analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Wallet,
  CalendarClock,
  Users,
  BadgeCheck,
  BadgeAlert,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Crown,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/")({
  component: KingDashboard,
  head: () => ({
    meta: [
      { title: "King Dashboard | Farix Analytics" },
      {
        name: "description",
        content:
          "Earnings, plan mix, cookie account health, daily signups and investment tracking for Farix.",
      },
      { property: "og:title", content: "King Dashboard | Farix Analytics" },
      {
        property: "og:description",
        content: "Earnings, plan mix, cookie accounts, daily signups and investments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TOOL_ORDER = ["veo-3", "gemini"];
const TOOL_FEATURE: Record<string, "veo" | "gemini"> = {
  "veo-3": "veo",
  gemini: "gemini",
};

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "chart-2" | "chart-3" | "chart-5";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    "chart-2": "bg-chart-2/15 text-chart-2",
    "chart-3": "bg-chart-3/15 text-chart-3",
    "chart-5": "bg-chart-5/15 text-chart-5",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-md", toneMap[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-xs font-medium text-muted-foreground truncate">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{hint}</div>}
    </div>
  );
}

function KingDashboard() {
  const qc = useQueryClient();
  const plans = useQuery(masterPlansQuery);
  const tools = useQuery(activeToolsQuery);
  const profiles = useQuery(kingProfilesQuery);
  const accounts = useQuery(toolAccountsQuery);
  const investments = useQuery(investmentsQuery);

  const [invOpen, setInvOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);

  const rows = plans.data ?? [];
  const totals = useMemo(() => summarizeEarnings(rows), [rows]);

  const people = profiles.data ?? [];
  const users = useMemo(() => people.filter((p) => p.role === "user"), [people]);
  const resellers = useMemo(() => people.filter((p) => p.role === "reseller"), [people]);

  const now = Date.now();
  const activeUsers = users.filter(
    (u) => u.is_active && (!u.expires_at || new Date(u.expires_at).getTime() > now),
  ).length;
  const expiredUsers = users.length - activeUsers;

  const todayKey = pktDayKey(now);
  const weekKeys = new Set(lastPktDays(7));
  const newToday = users.filter((u) => pktDayKey(u.created_at) === todayKey).length;
  const newWeek = users.filter((u) => weekKeys.has(pktDayKey(u.created_at))).length;
  const monthPrefix = pktMonthKey();
  const newMonth = users.filter((u) => pktDayKey(u.created_at).slice(0, 7) === monthPrefix).length;

  /** Paid plan (pro/master) per user, from user_plans. */
  const paidPlanByUser = useMemo(() => {
    const map = new Map<string, { plan: string; is_paid: boolean; expires_at: string }>();
    for (const r of rows) {
      const cur = map.get(r.user_id);
      if (!cur || (r.is_paid && !cur.is_paid)) {
        map.set(r.user_id, { plan: r.plan, is_paid: r.is_paid, expires_at: r.expires_at });
      }
    }
    return map;
  }, [rows]);

  /** Free = self-signup trial users (signup_source = 'public'). */
  const freeUsers = useMemo(
    () => users.filter((u) => (u.signup_source ?? "invite") === "public"),
    [users],
  );
  const freeMonth = freeUsers.filter(
    (u) => pktDayKey(u.created_at).slice(0, 7) === monthPrefix,
  ).length;
  /** Converted = signed up free AND now holds a PAID pro/master plan. */
  const convertedUsers = useMemo(
    () =>
      freeUsers.filter((u) => {
        const p = paidPlanByUser.get(u.id);
        return !!p && p.is_paid && (p.plan === "pro" || p.plan === "master");
      }),
    [freeUsers, paidPlanByUser],
  );
  const convRate =
    freeUsers.length > 0 ? Math.round((convertedUsers.length / freeUsers.length) * 100) : 0;

  const planCounts = useMemo(() => {
    let pro = 0;
    let master = 0;
    for (const r of rows) {
      if (r.plan === "pro") pro += 1;
      else if (r.plan === "master") master += 1;
    }
    return { pro, master };
  }, [rows]);


  const cookiesByTool = useMemo(() => {
    const map = new Map<string, { active: number; expired: number }>();
    for (const a of accounts.data ?? []) {
      const cur = map.get(a.tool_id) ?? { active: 0, expired: 0 };
      if (a.is_active && a.status === "active") cur.active += 1;
      else cur.expired += 1;
      map.set(a.tool_id, cur);
    }
    return map;
  }, [accounts.data]);

  const orderedTools = useMemo(() => {
    return [...(tools.data ?? [])].sort(
      (a, b) => TOOL_ORDER.indexOf(a.slug) - TOOL_ORDER.indexOf(b.slug),
    );
  }, [tools.data]);

  const chartDays = 14;
  const chartData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const u of users) {
      const k = pktDayKey(u.created_at);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return lastPktDays(chartDays).map((k) => ({
      key: k,
      label: pktDayLabel(k),
      users: counts.get(k) ?? 0,
    }));
  }, [users]);

  // Earnings today / this week (PKT), from confirmed payments.
  const earnToday = rows
    .filter((r) => r.paid_at && pktDayKey(r.paid_at) === todayKey)
    .reduce((s, r) => s + Number(r.paid_amount ?? 0), 0);
  const earnWeek = rows
    .filter((r) => r.paid_at && weekKeys.has(pktDayKey(r.paid_at)))
    .reduce((s, r) => s + Number(r.paid_amount ?? 0), 0);

  const invList = investments.data ?? [];
  const monthKey = pktMonthKey();
  const invMonth = invList
    .filter((i) => i.spent_on.slice(0, 7) === monthKey)
    .reduce((s, i) => s + i.amount, 0);
  const invAll = invList.reduce((s, i) => s + i.amount, 0);
  const profit = totals.all - invAll;

  // Reseller pending overview.
  const pendingByReseller = useMemo(() => {
    const map = new Map<string, { count: number }>();
    for (const r of rows) {
      const owner = r.profiles?.created_by;
      if (!owner || r.is_paid) continue;
      const cur = map.get(owner) ?? { count: 0 };
      cur.count += 1;
      map.set(owner, cur);
    }
    return [...map.entries()]
      .map(([id, v]) => {
        const res = resellers.find((x) => x.id === id);
        return { id, name: res?.full_name || res?.email || "Unknown reseller", count: v.count };
      })
      .sort((a, b) => b.count - a.count);
  }, [rows, resellers]);

  const activeResellers = resellers.filter((r) => r.is_active).length;

  async function deleteInvestment(id: string) {
    if (!confirm("Delete this investment entry?")) return;
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: investmentsQuery.queryKey });
  }

  function refreshInvestments() {
    qc.invalidateQueries({ queryKey: investmentsQuery.queryKey });
  }

  const loaded = plans.isSuccess && profiles.isSuccess;
  const dash = (v: string | number) => (loaded ? v : "—");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">King Panel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Earnings, plan mix, cookie health and daily growth — all times in PKT.
        </p>
      </div>

      {/* Compact stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <Tile
          icon={Wallet}
          label="Earnings (All-time)"
          value={dash(formatRs(totals.all))}
          hint={`Today ${formatRs(earnToday)}`}
        />
        <Tile
          icon={CalendarClock}
          label="Last 30 Days"
          value={dash(formatRs(totals.last30))}
          hint={`This week ${formatRs(earnWeek)}`}
          tone="chart-2"
        />
        <Tile
          icon={Users}
          label="Total Users"
          value={dash(users.length)}
          hint={`${activeUsers} active · ${expiredUsers} expired`}
          tone="chart-3"
        />
        <Tile
          icon={CalendarClock}
          label="Users this month"
          value={dash(newMonth)}
          hint={`${newToday} today · ${newWeek} this week`}
          tone="chart-3"
        />
        <Tile
          icon={Sparkles}
          label="Free signups"
          value={dash(freeUsers.length)}
          hint={`${freeMonth} this month`}
          tone="primary"
        />
        <Tile
          icon={TrendingUp}
          label="Free → Paid"
          value={dash(convertedUsers.length)}
          hint={`${convRate}% conversion`}
          tone="chart-2"
        />

        <Tile
          icon={BadgeCheck}
          label="Paid Plans"
          value={dash(totals.paidCount)}
          hint={`of ${totals.total} plans`}
          tone="chart-2"
        />
        <Tile
          icon={BadgeAlert}
          label="Unpaid Plans"
          value={dash(totals.pendingCount)}
          hint={`${totals.pendingResellers} reseller(s) pending`}
          tone="chart-5"
        />
        <Tile
          icon={Crown}
          label="Plan Mix"
          value={dash(`${planCounts.pro} / ${planCounts.master}`)}
          hint={`${planName("pro")} / ${planName("master")}`}
          tone="primary"
        />
      </div>

      {/* Cookie accounts by tool + growth */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <div className="text-xs font-medium text-muted-foreground">Active Cookie Accounts</div>
          <div className="mt-3 space-y-2">
            {orderedTools.map((t) => {
              const c = cookiesByTool.get(t.id) ?? { active: 0, expired: 0 };
              return (
                <div key={t.id} className="flex items-center gap-2.5">
                  <ToolLogo tool={t} className="h-7 w-7" />
                  <div className="text-sm truncate">{t.name}</div>
                  <div className="ml-auto text-right">
                    <span className="text-lg font-semibold tabular-nums">{c.active}</span>
                    {c.expired > 0 && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground">
                        {c.expired} expired
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {orderedTools.length === 0 && (
              <div className="text-sm text-muted-foreground">No tools yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Users created per day</div>
              <div className="text-[11px] text-muted-foreground">
                Last {chartDays} days · PKT calendar days (12 AM → 12 AM)
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold tabular-nums">{newToday}</div>
              <div className="text-[11px] text-muted-foreground">today · {newWeek} this week</div>
            </div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                  labelFormatter={(l) => `${l} (PKT)`}
                  formatter={(v: number) => [v, "Users created"]}
                />
                <Bar dataKey="users" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tool usage */}
      <Card className="p-5">
        <div className="text-sm font-medium">Tool usage</div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Plan access, payments collected and live cookie accounts.
        </p>
        <div className="grid gap-3 mt-4 sm:grid-cols-3">
          {orderedTools.map((t) => {
            const feature = TOOL_FEATURE[t.slug] ?? "veo";
            const withAccess = rows.filter((r) => planIncludes(r.plan, feature));
            const paid = withAccess.filter((r) => r.is_paid);
            const earned = paid.reduce((s, r) => s + Number(r.paid_amount ?? 0), 0);
            const pct =
              users.length > 0 ? Math.round((withAccess.length / users.length) * 100) : 0;
            const c = cookiesByTool.get(t.id) ?? { active: 0, expired: 0 };
            return (
              <div key={t.id} className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2.5">
                  <ToolLogo tool={t} className="h-8 w-8" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.active} active account{c.active === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-xl font-semibold leading-none tabular-nums">
                      {withAccess.length}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">users</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{pct}% of users</span>
                  <span>
                    {paid.length} paid · {withAccess.length - paid.length} unpaid ·{" "}
                    {formatRs(earned)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Investment */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Investment & profit</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Costs you add here are subtracted from earnings.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setInvOpen(true);
              }}
              className="bg-gradient-to-r from-violet-600 to-pink-500 text-white hover:opacity-90"
            >
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Tile
              icon={Wallet}
              label="This month"
              value={formatRs(invMonth)}
              tone="chart-5"
            />
            <Tile icon={Wallet} label="All-time" value={formatRs(invAll)} tone="chart-3" />
            <Tile
              icon={TrendingUp}
              label="Rough profit"
              value={formatRs(profit)}
              hint="Earnings − investment"
              tone={profit >= 0 ? "chart-2" : "chart-5"}
            />
          </div>

          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {invList.slice(0, 6).map((i) => (
              <div key={i.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{i.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {i.spent_on}
                    {i.note ? ` · ${i.note}` : ""}
                  </div>
                </div>
                <div className="ml-auto text-sm font-semibold tabular-nums">
                  {formatRs(i.amount)}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditing(i);
                    setInvOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => deleteInvestment(i.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {invList.length === 0 && (
              <div className="px-3.5 py-6 text-center text-sm text-muted-foreground">
                No investments recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Reseller overview */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Reseller overview</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Who still owes you — check this daily.
              </p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link to="/king/resellers">
                Open <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Tile icon={Users} label="Active resellers" value={dash(activeResellers)} />
            <Tile
              icon={BadgeAlert}
              label="With dues"
              value={dash(pendingByReseller.length)}
              tone="chart-5"
            />
            <Tile
              icon={BadgeAlert}
              label="Unpaid plans"
              value={dash(totals.pendingCount)}
              tone="chart-5"
            />
          </div>

          <div className="mt-4 divide-y divide-border rounded-xl border border-border">
            {pendingByReseller.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                to="/king/resellers/$id"
                params={{ id: r.id }}
                className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-muted/40"
              >
                <span className="truncate text-sm">{r.name}</span>
                <span className="ml-auto text-xs font-medium text-amber-600">
                  {r.count} pending
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {pendingByReseller.length === 0 && (
              <div className="px-3.5 py-6 text-center text-sm text-muted-foreground">
                No pending payments. All clear.
              </div>
            )}
          </div>
        </Card>
      </div>

      <InvestmentDialog
        open={invOpen}
        onOpenChange={setInvOpen}
        investment={editing}
        onSaved={refreshInvestments}
      />
    </div>
  );
}
