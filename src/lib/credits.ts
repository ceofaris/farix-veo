import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Veo / Google Flow is the only metered tool. 30 credits per successful video. */
export const VEO_CREDIT_COST = 30;
export const TEST_USER_CREDITS = 500;
export const PAID_USER_CREDITS = 45000;

export function formatCredits(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-US");
}

/** Current user's remaining credits. */
export function useMyCredits() {
  return useQuery({
    queryKey: ["my-credits"],
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return 0;
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw error;
      return data?.credits ?? 0;
    },
  });
}

/** Credits for a set of users (king sees all, reseller sees own users — enforced by RLS). */
export function useCreditsFor(userIds: string[]) {
  const key = [...userIds].sort().join(",");
  return useQuery({
    queryKey: ["credits-map", key],
    enabled: userIds.length > 0,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("user_id, credits")
        .in("user_id", userIds);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        map[r.user_id] = r.credits;
      });
      return map;
    },
  });
}

export async function setUserCredits(userId: string, credits: number) {
  const { error } = await supabase.rpc("set_user_credits", {
    p_user_id: userId,
    p_credits: credits,
  });
  if (error) throw error;
}

export async function adjustUserCredits(userId: string, delta: number) {
  const { error } = await supabase.rpc("adjust_user_credits", {
    p_user_id: userId,
    p_delta: delta,
  });
  if (error) throw error;
}
