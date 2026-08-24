import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { PLAN_IDS, PLANS, type PlanDef, type PlanId } from "@/lib/plans";

/** Plans the signed-in king/reseller may sell. */
export function useAllowedPlans() {
  const { profile } = useProfile();
  const isKing = profile?.role === "king";

  const query = useQuery({
    queryKey: ["reseller-plans", profile?.id],
    enabled: !!profile && !isKing,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PlanId[]> => {
      const { data, error } = await supabase
        .from("reseller_plans")
        .select("plan")
        .eq("reseller_id", profile!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.plan as PlanId);
    },
  });

  const ids: PlanId[] = isKing ? [...PLAN_IDS] : (query.data ?? []);
  const plans: PlanDef[] = PLANS.filter((p) => ids.includes(p.id));
  return { planIds: ids, plans, loading: !isKing && query.isLoading };
}

/** Plans assigned to a specific reseller (king view). */
export function useResellerPlans(resellerId: string | null | undefined) {
  return useQuery({
    queryKey: ["reseller-plans", resellerId],
    enabled: !!resellerId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PlanId[]> => {
      const { data, error } = await supabase
        .from("reseller_plans")
        .select("plan")
        .eq("reseller_id", resellerId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.plan as PlanId);
    },
  });
}
