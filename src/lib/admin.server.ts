import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { PLAN_IDS, type PlanId } from "@/lib/plans";

export async function assertRole(userId: string, roles: string[]) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !roles.includes(data.role)) throw new Error("Forbidden");
  return data.role as string;
}

/** Plans a reseller is allowed to sell. Kings may sell every plan. */
export async function allowedPlansFor(userId: string): Promise<PlanId[]> {
  const { data: me } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (me?.role === "king") return [...PLAN_IDS];
  const { data, error } = await supabaseAdmin
    .from("reseller_plans")
    .select("plan")
    .eq("reseller_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.plan as PlanId);
}

/** Replace the plan assignment list for a reseller. */
export async function setResellerPlans(resellerId: string, plans: PlanId[]) {
  const unique = [...new Set(plans)].filter((p) => (PLAN_IDS as string[]).includes(p));
  const { error: delErr } = await supabaseAdmin
    .from("reseller_plans")
    .delete()
    .eq("reseller_id", resellerId);
  if (delErr) throw new Error(delErr.message);
  if (!unique.length) return;
  const { error } = await supabaseAdmin
    .from("reseller_plans")
    .insert(unique.map((plan) => ({ reseller_id: resellerId, plan })));
  if (error) throw new Error(error.message);
}
