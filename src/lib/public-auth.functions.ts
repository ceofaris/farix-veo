import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Public email/password signup was removed on purpose: self-signup now goes
 * through Google OAuth only, so every public account is a verified identity
 * and there is no unauthenticated account-creation endpoint to abuse.
 */

function clientIp(): string {
  const req = getRequest();
  const h = req?.headers;
  if (!h) return "";
  const raw =
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    (h.get("x-forwarded-for") ?? "").split(",")[0] ??
    "";
  return raw.trim().slice(0, 64);
}

/** Records the caller's IP; the database suspends accounts seen from >3 IPs. */
export const recordLoginIp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ip = clientIp();
    if (!ip) return { ok: true, status: null as string | null };
    const { data, error } = await context.supabase.rpc("record_login_ip", { p_ip: ip });
    if (error) return { ok: false, status: null as string | null };
    const result = (data ?? {}) as { status?: string };
    return { ok: true, status: result.status ?? null };
  });

/** King-only: lift a suspension and reset the tracked IP list. */
export const reactivateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await import("@/lib/admin.server");
    await admin.assertRole(context.userId, ["king"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "active" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_login_ips").delete().eq("user_id", data.id);
    return { ok: true };
  });

/** King-only: suspend an account manually. */
export const suspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await import("@/lib/admin.server");
    await admin.assertRole(context.userId, ["king"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: "suspended" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
