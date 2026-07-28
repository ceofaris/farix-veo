import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/panel-layout";
import { StatCard } from "@/routes/_authenticated/king/index";
import { Users, Wrench } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/reseller/")({
  component: ResellerDashboard,
});

function ResellerDashboard() {
  const { profile } = useProfile();
  const stats = useQuery({
    queryKey: ["reseller-stats", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const [users, tools] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("created_by", profile!.id),
        supabase.from("reseller_tools").select("id", { count: "exact", head: true }).eq("reseller_id", profile!.id),
      ]);
      return { users: users.count ?? 0, tools: tools.count ?? 0 };
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your users and tools." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        <StatCard icon={Users} label="My Users" value={stats.data?.users ?? "—"} tone="primary" />
        <StatCard icon={Wrench} label="Assigned Tools" value={stats.data?.tools ?? "—"} tone="chart-2" />
      </div>
    </div>
  );
}
