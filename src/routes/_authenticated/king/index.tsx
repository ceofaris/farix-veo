import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/panel-layout";
import { ToolLogo } from "@/components/tool-logo";
import { Users, UserCog, KeyRound, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/king/")({
  component: KingDashboard,
});

type ToolStat = { id: string; name: string; slug: string; users: number; accounts: number };

function KingDashboard() {
  const stats = useQuery({
    queryKey: ["king-analytics"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const [users, activeUsers, resellers, activeResellers, tools, userTools, accounts] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "user")
            .eq("is_active", true)
            .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reseller"),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "reseller")
            .eq("is_active", true),
          supabase.from("tools").select("id, name, slug").eq("is_active", true).order("name"),
          supabase.from("user_tools").select("tool_id, is_paid"),
          supabase.from("tool_accounts").select("tool_id, is_active"),
        ]);

      const toolRows = (tools.data ?? []) as { id: string; name: string; slug: string }[];
      const byTool: ToolStat[] = toolRows.map((t) => ({
        ...t,
        users: (userTools.data ?? []).filter((r) => r.tool_id === t.id).length,
        accounts: (accounts.data ?? []).filter((r) => r.tool_id === t.id && r.is_active).length,
      }));

      const assignments = userTools.data ?? [];

      return {
        users: users.count ?? 0,
        activeUsers: activeUsers.count ?? 0,
        totalAssignments: assignments.length,
        paidAssignments: assignments.filter((a) => a.is_paid).length,
        resellers: resellers.count ?? 0,
        activeResellers: activeResellers.count ?? 0,
        accounts: (accounts.data ?? []).filter((a) => a.is_active).length,
        byTool,
      };
    },
  });


  const d = stats.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">King Panel</h1>
        <p className="text-muted-foreground mt-2">
          Live overview of users, resellers and the two platform tools.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Total Users"
          value={d?.users ?? "—"}
          hint={d ? `${d.activeUsers} currently active` : undefined}
          tone="primary"
        />
        <StatCard
          icon={BadgeCheck}
          label="Paid Users"
          value={d?.paidUsers ?? "—"}
          hint={d ? `${Math.max(d.users - d.paidUsers, 0)} unpaid` : undefined}
          tone="chart-3"
        />
        <StatCard
          icon={UserCog}
          label="Resellers"
          value={d?.resellers ?? "—"}
          hint={d ? `${d.activeResellers} active` : undefined}
          tone="chart-2"
        />
        <StatCard
          icon={KeyRound}
          label="Active Cookie Accounts"
          value={d?.accounts ?? "—"}
          hint="Across ChatGPT and Veo 3"
          tone="chart-5"
        />
      </div>

      <Card className="p-6 sm:p-8">
        <div className="font-medium">Tool usage</div>
        <p className="text-sm text-muted-foreground mt-1">
          How many users have access to each tool and how many cookie accounts are live.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {(d?.byTool ?? []).map((t) => {
            const pct = d && d.users > 0 ? Math.round((t.users / d.users) * 100) : 0;
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
                <div className="mt-2 text-[11px] text-muted-foreground">
                  {pct}% of all users have access
                </div>
              </div>
            );
          })}
          {!d && [0, 1].map((i) => <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse" />)}
        </div>
      </Card>
    </div>
  );
}
