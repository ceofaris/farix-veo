import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/stat-card";
import { PanelTabs } from "@/components/panel-tabs";
import { Card } from "@/components/panel-layout";
import { Users, Wrench, UserCog, KeyRound, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/king/")({
  component: KingDashboard,
});

function KingDashboard() {
  const stats = useQuery({
    queryKey: ["king-stats"],
    queryFn: async () => {
      const [users, resellers, tools, accounts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "reseller"),
        supabase.from("tools").select("id", { count: "exact", head: true }),
        supabase.from("tool_accounts").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);
      return {
        users: users.count ?? 0,
        resellers: resellers.count ?? 0,
        tools: tools.count ?? 0,
        accounts: accounts.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">King Panel</h1>
        <p className="text-muted-foreground mt-2">
          Real-time overview of every tool, reseller and user on the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.data?.users ?? "—"}
          hint="All registered end users"
          tone="primary"
        />
        <StatCard
          icon={UserCog}
          label="Total Resellers"
          value={stats.data?.resellers ?? "—"}
          hint="Reseller accounts"
          tone="chart-2"
        />
        <StatCard
          icon={Wrench}
          label="Total Tools"
          value={stats.data?.tools ?? "—"}
          hint="Tools available on the platform"
          tone="chart-3"
        />
        <StatCard
          icon={KeyRound}
          label="Active Accounts"
          value={stats.data?.accounts ?? "—"}
          hint="Cookie accounts currently active"
          tone="chart-5"
        />
      </div>

      <PanelTabs
        items={[
          { to: "/king", label: "Dashboard" },
          { to: "/king/tools", label: "Tools" },
          { to: "/king/resellers", label: "Resellers" },
          { to: "/king/users", label: "Users" },
        ]}
      />

      <Card className="p-8">
        <div className="flex items-center gap-2 font-medium">
          <Activity className="h-4 w-4 text-primary" /> Platform overview
        </div>
        <p className="text-sm text-muted-foreground mt-1">Current state of your platform at a glance.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Users per reseller</div>
            <div className="text-2xl font-semibold mt-2">
              {stats.data && stats.data.resellers > 0
                ? (stats.data.users / stats.data.resellers).toFixed(1)
                : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Accounts per tool</div>
            <div className="text-2xl font-semibold mt-2">
              {stats.data && stats.data.tools > 0 ? (stats.data.accounts / stats.data.tools).toFixed(1) : "—"}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-5">
            <div className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Total records</div>
            <div className="text-2xl font-semibold mt-2">
              {stats.data
                ? stats.data.users + stats.data.resellers + stats.data.tools + stats.data.accounts
                : "—"}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
