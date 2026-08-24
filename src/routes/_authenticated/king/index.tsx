import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/panel-layout";
import { ToolLogo } from "@/components/tool-logo";
import { formatRs } from "@/components/mark-paid-dialog";
import { activeToolsQuery, masterPlansQuery, summarizeEarnings } from "@/lib/queries";
import {
  Users,
  KeyRound,
  BadgeCheck,
  BadgeAlert,
  Wallet,
  CalendarClock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/king/")({
  component: KingDashboard,
});

function KingDashboard() {
  /** Same query (and cache key) the Resellers page uses — one shared earnings source. */
  const accounts = useQuery(masterPlansQuery);
  const tools = useQuery(activeToolsQuery);

  const counts = useQuery({
    queryKey: ["king-counts"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const [users, activeUsers, cookieAccounts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "user")
          .eq("is_active", true)
          .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
        supabase
          .from("tool_accounts")
          .select("tool_id")
          .eq("is_active", true),
      ]);
      return {
        users: users.count ?? 0,
        activeUsers: activeUsers.count ?? 0,
        cookieAccounts: (cookieAccounts.data ?? []) as { tool_id: string }[],
      };
    },
  });

  const rows = accounts.data ?? [];
  const totals = useMemo(() => summarizeEarnings(rows), [rows]);

  const byTool = useMemo(() => {
    const cookies = counts.data?.cookieAccounts ?? [];
    // Every Master plan unlocks every tool, so per-tool numbers mirror the plan totals.
    return (tools.data ?? []).map((t) => ({
      ...t,
      users: rows.length,
      assignments: rows.length,
      paid: rows.filter((r) => r.is_paid).length,
      earned: rows.filter((r) => r.is_paid).reduce((s, r) => s + Number(r.paid_amount ?? 0), 0),
      accounts: cookies.filter((c) => c.tool_id === t.id).length,
    }));
  }, [tools.data, rows, counts.data]);

  const loaded = accounts.isSuccess && counts.isSuccess;
  const totalUsers = counts.data?.users ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">King Panel</h1>
        <p className="text-muted-foreground mt-2">
          Live overview of Master plan earnings, users and cookie accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          icon={Wallet}
          label="Total Earnings (All-time)"
          value={loaded ? formatRs(totals.all) : "—"}
          hint="Same source as the Resellers page"
          tone="primary"
        />
        <StatCard
          icon={CalendarClock}
          label="Last 30 Days Earnings"
          value={loaded ? formatRs(totals.last30) : "—"}
          hint="Payments confirmed in the last 30 days"
          tone="chart-2"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={loaded ? totalUsers : "—"}
          hint={loaded ? `${counts.data?.activeUsers ?? 0} currently active` : undefined}
          tone="chart-3"
        />
        <StatCard
          icon={BadgeCheck}
          label="Paid Master Plans"
          value={loaded ? totals.paidCount : "—"}
          hint={loaded ? `of ${totals.total} Master plans` : undefined}
          tone="chart-2"
        />
        <StatCard
          icon={BadgeAlert}
          label="Unpaid Master Plans"
          value={loaded ? totals.pendingCount : "—"}
          hint={loaded ? `${totals.pendingResellers} reseller(s) with pending dues` : undefined}
          tone="chart-5"
        />
        <StatCard
          icon={KeyRound}
          label="Active Cookie Accounts"
          value={loaded ? (counts.data?.cookieAccounts.length ?? 0) : "—"}
          hint="Across ChatGPT and Veo 3"
          tone="chart-5"
        />
      </div>

      <Card className="p-6 sm:p-8">
        <div className="font-medium">Tool usage</div>
        <p className="text-sm text-muted-foreground mt-1">
          Master plan users, payments collected and live cookie accounts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {byTool.map((t) => {
            const pct = totalUsers > 0 ? Math.round((t.users / totalUsers) * 100) : 0;
            return (
              <div key={t.id} className="rounded-xl border border-border bg-muted/30 p-5">
                <div className="flex items-center gap-3">
                  <ToolLogo tool={t} className="w-10 h-10" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.accounts} active cookie account{t.accounts === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-semibold leading-none">{t.users}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">users</div>
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{pct}% of all users have access</span>
                  <span>
                    {t.paid}/{t.assignments} paid · {formatRs(t.earned)}
                  </span>
                </div>
              </div>
            );
          })}
          {!loaded &&
            [0, 1].map((i) => <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse" />)}
        </div>
      </Card>
    </div>
  );
}
