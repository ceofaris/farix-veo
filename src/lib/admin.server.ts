import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertRole(userId: string, roles: string[]) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !roles.includes(data.role)) throw new Error("Forbidden");
}

