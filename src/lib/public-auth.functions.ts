import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { checkSignupEmail, normalizeEmail } from "@/lib/email-guard";

/**
 * Public, unauthenticated signup. Creates the auth user with the service-role
 * client; the database trigger creates the profile and grants the one-time
 * 1-hour trial (only if this email never had one).
 */
export const publicSignup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().min(3).max(200),
        password: z.string().min(6).max(200),
        full_name: z.string().min(1).max(120),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const email = normalizeEmail(data.email);
    const emailError = checkSignupEmail(email);
    if (emailError) throw new Error(emailError);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      throw new Error("An account already exists for this email. Please sign in instead.");
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name.trim() },
    });
    if (error) {
      if (/already/i.test(error.message)) {
        throw new Error("An account already exists for this email. Please sign in instead.");
      }
      throw new Error(error.message);
    }

    const uid = created.user!.id;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", uid)
      .maybeSingle();

    return { ok: true, id: uid, trial_ends_at: profile?.trial_ends_at ?? null };
  });

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
