import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** Id of the only credit-based tool (Veo 3), or null when it is missing. */
export async function veoToolId(): Promise<string | null> {
  const { data } = await supabaseAdmin.from("tools").select("id").eq("slug", "veo-3").maybeSingle();
  return (data?.id as string) ?? null;
}


export async function assertRole(userId: string, roles: string[]) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !roles.includes(data.role)) throw new Error("Forbidden");
}

/** Resellers may only assign tools they own; kings may assign anything. */
export async function allowedToolIds(actorId: string, ownerId: string, requested: string[]) {
  if (!requested.length) return [];
  const { data: actor } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", actorId)
    .maybeSingle();
  if (actor?.role === "king") return requested;
  const { data: owned } = await supabaseAdmin
    .from("reseller_tools")
    .select("tool_id")
    .eq("reseller_id", ownerId);
  const allowed = new Set((owned ?? []).map((r) => r.tool_id as string));
  return requested.filter((t) => allowed.has(t));
}
