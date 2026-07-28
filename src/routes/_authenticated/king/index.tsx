import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/panel-layout";
import { Users, Wrench, UserCog, KeyRound } from "lucide-react";

export const Route = createFileRoute("/_authenticated/king/")({
  component: KingDashboard,
});

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-neutral-400 uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-semibold mt-0.5">{value}</div>
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
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-neutral-400 text-sm mt-1">Overview of your platform.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard icon={Users} label="Total Users" value={stats.data?.users ?? "—"} />
        <StatCard icon={UserCog} label="Total Resellers" value={stats.data?.resellers ?? "—"} />
        <StatCard icon={Wrench} label="Total Tools" value={stats.data?.tools ?? "—"} />
        <StatCard icon={KeyRound} label="Active Accounts" value={stats.data?.accounts ?? "—"} />
      </div>
    </div>
  );
}
