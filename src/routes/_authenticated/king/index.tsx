import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/panel-layout";
import { StatCard } from "@/components/stat-card";
import { Users, Wrench, UserCog, KeyRound } from "lucide-react";

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
