import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.string().email();

// Bootstrap: creates the first king if no king exists yet.
// Anyone can call it, but it's a no-op once a king exists.
export const bootstrapKing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        email: emailSchema,
        password: z.string().min(6),
        full_name: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cErr } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "king");
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) > 0) throw new Error("A king already exists. Bootstrap is disabled.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, role: "king" },
    });
    if (error) throw new Error(error.message);
    // Upsert profile as king
    await supabaseAdmin.from("profiles").upsert({
      id: created.user!.id,
      email: data.email,
      full_name: data.full_name,
      role: "king",
      is_active: true,
    });
    return { ok: true };
  });


export const createReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: emailSchema,
        password: z.string().min(6),
        full_name: z.string().min(1),
        days: z.number().int().min(0).default(30),
        tool_ids: z.array(z.string().uuid()).default([]),
        is_active: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/admin.server")).assertRole(context.userId, ["king"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, role: "reseller" },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    const expires_at = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      email: data.email,
      full_name: data.full_name,
      role: "reseller",
      is_active: data.is_active,
      expires_at,
      created_by: context.userId,
    });
    if (data.tool_ids.length) {
      await supabaseAdmin
        .from("reseller_tools")
        .insert(data.tool_ids.map((tid) => ({ reseller_id: uid, tool_id: tid })));
    }
    return { ok: true, id: uid };
  });

export const updateReseller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().min(1),
        days: z.number().int().min(0).optional(),
        tool_ids: z.array(z.string().uuid()).default([]),
        is_active: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/admin.server")).assertRole(context.userId, ["king"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { full_name: string; is_active: boolean; expires_at?: string } = {
      full_name: data.full_name,
      is_active: data.is_active,
    };
    if (typeof data.days === "number") {
      patch.expires_at = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();
    }
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("reseller_tools").delete().eq("reseller_id", data.id);
    if (data.tool_ids.length) {
      await supabaseAdmin
        .from("reseller_tools")
        .insert(data.tool_ids.map((tid) => ({ reseller_id: data.id, tool_id: tid })));
    }
    return { ok: true };
  });

export const deleteAuthUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // King can delete anyone; reseller can only delete users they created
    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (!me) throw new Error("Forbidden");
    if (me.role === "reseller") {
      const { data: target } = await supabaseAdmin
        .from("profiles")
        .select("role, created_by")
        .eq("id", data.id)
        .maybeSingle();
      if (!target || target.role !== "user" || target.created_by !== context.userId)
        throw new Error("Forbidden");
    } else if (me.role !== "king") {
      throw new Error("Forbidden");
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createEndUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: emailSchema,
        password: z.string().min(6),
        full_name: z.string().min(1),
        days: z.number().int().min(0).default(30),
        is_active: z.boolean().default(true),
        owner_id: z.string().uuid().optional(),
        tool_ids: z.array(z.string().uuid()).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/admin.server")).assertRole(context.userId, ["king", "reseller"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only a king may create a user on behalf of a reseller.
    let owner = context.userId;
    if (data.owner_id && data.owner_id !== context.userId) {
      await (await import("@/lib/admin.server")).assertRole(context.userId, ["king"]);
      const { data: target } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", data.owner_id)
        .maybeSingle();
      if (!target || target.role !== "reseller") throw new Error("Invalid owner");
      owner = data.owner_id;
    }
    const tool_ids = await (await import("@/lib/admin.server")).allowedToolIds(context.userId, owner, data.tool_ids);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, role: "user" },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    const expires_at = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      email: data.email,
      full_name: data.full_name,
      role: "user",
      is_active: data.is_active,
      expires_at,
      created_by: owner,
    });
    if (tool_ids.length) {
      await supabaseAdmin.from("user_tools").insert(tool_ids.map((tid) => ({ user_id: uid, tool_id: tid })));
    }
    return { ok: true, id: uid };
  });

export const updateEndUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().min(1),
        days: z.number().int().min(0).optional(),
        is_active: z.boolean(),
        tool_ids: z.array(z.string().uuid()).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    if (!me || !["king", "reseller"].includes(me.role)) throw new Error("Forbidden");
    const { data: target } = await supabaseAdmin
      .from("profiles")
      .select("created_by, role")
      .eq("id", data.id)
      .maybeSingle();
    if (!target || target.role !== "user") throw new Error("Forbidden");
    if (me.role === "reseller" && target.created_by !== context.userId) throw new Error("Forbidden");

    const patch: { full_name: string; is_active: boolean; expires_at?: string } = {
      full_name: data.full_name,
      is_active: data.is_active,
    };
    if (typeof data.days === "number") {
      patch.expires_at = new Date(Date.now() + data.days * 24 * 60 * 60 * 1000).toISOString();
    }
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.tool_ids) {
      const tool_ids = await (await import("@/lib/admin.server")).allowedToolIds(
        context.userId,
        target.created_by ?? context.userId,
        data.tool_ids,
      );
      await supabaseAdmin.from("user_tools").delete().eq("user_id", data.id);
      if (tool_ids.length) {
        await supabaseAdmin
          .from("user_tools")
          .insert(tool_ids.map((tid) => ({ user_id: data.id, tool_id: tid })));
      }
    }
    return { ok: true };
  });

/** King-only: flip a user's payment status and record the amount paid. */
export const setUserPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        is_paid: z.boolean(),
        amount: z.number().positive().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/admin.server")).assertRole(context.userId, ["king"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.is_paid && !(data.amount && data.amount > 0)) {
      throw new Error("Enter a valid payment amount.");
    }
    const patch = data.is_paid
      ? { is_paid: true, paid_amount: data.amount!, paid_at: new Date().toISOString() }
      : { is_paid: false, paid_amount: null, paid_at: null };
    const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** King-only: set payment status for a single tool assignment (account). */
export const setAccountPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(), // user_tools.id
        is_paid: z.boolean(),
        amount: z.number().positive().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await (await import("@/lib/admin.server")).assertRole(context.userId, ["king"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.is_paid && !(data.amount && data.amount > 0)) {
      throw new Error("Enter a valid payment amount.");
    }
    const patch = data.is_paid
      ? { is_paid: true, paid_amount: data.amount!, paid_at: new Date().toISOString() }
      : { is_paid: false, paid_amount: null, paid_at: null };
    const { error } = await supabaseAdmin.from("user_tools").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });



