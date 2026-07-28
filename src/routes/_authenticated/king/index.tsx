import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader } from "@/components/panel-layout";
import { Users, Wrench, UserCog, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/king/")({
  component: KingDashboard,
});

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "primary" | "chart-2" | "chart-3" | "chart-5";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    "chart-2": "bg-chart-2/15 text-chart-2",
    "chart-3": "bg-chart-3/15 text-chart-3",
    "chart-5": "bg-chart-5/15 text-chart-5",
  };
  return (
    <Card className="relative overflow-hidden hover:shadow-pop transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-[0.12em]">
            {label}
          </div>
          <div className="text-3xl font-semibold mt-2 tracking-tight">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

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
    <div>
      <PageHeader title="Dashboard" description="Overview of your platform." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
        <StatCard icon={Users} label="Total Users" value={stats.data?.users ?? "—"} tone="primary" />
        <StatCard icon={UserCog} label="Total Resellers" value={stats.data?.resellers ?? "—"} tone="chart-2" />
        <StatCard icon={Wrench} label="Total Tools" value={stats.data?.tools ?? "—"} tone="chart-3" />
        <StatCard icon={KeyRound} label="Active Accounts" value={stats.data?.accounts ?? "—"} tone="chart-5" />
      </div>
    </div>
  );
}
