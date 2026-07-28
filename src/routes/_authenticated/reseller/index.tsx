import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/panel-layout";
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
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-neutral-400 text-sm mt-1">Overview of your users and tools.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400 uppercase tracking-wide">My Users</div>
              <div className="text-2xl font-semibold mt-0.5">{stats.data?.users ?? "—"}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-neutral-400 uppercase tracking-wide">Assigned Tools</div>
              <div className="text-2xl font-semibold mt-0.5">{stats.data?.tools ?? "—"}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
