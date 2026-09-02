import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ToolLite = { id: string; name: string; slug: string };

/** The single plan the platform sells. */
export const MASTER_PLAN = {
  id: "master",
  name: "Master Plan",
  tagline: "One plan unlocks everything on Farix.",
  features: [
    "Veo 3 (Lite) — Unlimited",
    "Niche Prompts",
    "Freebies",
  ],
} as const;

/** Shared, long-cached tools list — the platform has exactly two fixed tools. */
export const activeToolsQuery = queryOptions({
  queryKey: ["tools", "active"],
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  queryFn: async (): Promise<ToolLite[]> => {
    const { data, error } = await supabase
      .from("tools")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []) as ToolLite[];
  },
});

/** Hard-coded marketing copy for the two fixed tools. */
const DESCRIPTIONS: Array<{ match: RegExp; text: string }> = [
  {
    match: /veo/i,
    text: "Google Veo 3 video generation — cinematic AI video with native audio, straight from your browser.",
  },
];

export function describeTool(tool: { name: string; slug?: string | null }) {
  const key = `${tool.slug ?? ""} ${tool.name}`;
  return (
    DESCRIPTIONS.find((d) => d.match.test(key))?.text ??
    "Premium AI tool access through the Farix browser extension."
  );
}

export const VEO_SLUG = "veo-3";

export function isVeo(tool: { slug?: string | null; name?: string | null } | null | undefined) {
  const key = `${tool?.slug ?? ""} ${tool?.name ?? ""}`;
  return /veo/i.test(key);
}

/** Single source of truth for plan earnings (shared by Dashboard and Resellers). */
export type MasterPlan = {
  id: string;
  plan: string;
  created_at: string;
  expires_at: string;
  is_paid: boolean;
  paid_amount: number | null;
  paid_at: string | null;
  user_id: string;
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    created_by: string | null;
    is_active: boolean;
  } | null;
};

export const masterPlansQuery = queryOptions({
  queryKey: ["master-plans"],
  staleTime: 60 * 1000,
  queryFn: async (): Promise<MasterPlan[]> => {
    const { data, error } = await supabase
      .from("user_plans")
      .select(
        "id, plan, created_at, expires_at, is_paid, paid_amount, paid_at, user_id, profiles!inner(id, email, full_name, created_by, is_active, role)",
      )
      .eq("profiles.role", "user")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as MasterPlan[];
  },
});

export function planExpired(expires_at: string | null | undefined) {
  return !!expires_at && new Date(expires_at).getTime() < Date.now();
}

export function summarizeEarnings(rows: MasterPlan[]) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let all = 0;
  let last30 = 0;
  let paidCount = 0;
  const pendingResellers = new Set<string>();
  for (const a of rows) {
    if (a.is_paid) {
      paidCount += 1;
      all += Number(a.paid_amount ?? 0);
      if (a.paid_at && new Date(a.paid_at).getTime() >= cutoff) last30 += Number(a.paid_amount ?? 0);
    } else if (a.profiles?.created_by) {
      pendingResellers.add(a.profiles.created_by);
    }
  }
  return {
    all,
    last30,
    total: rows.length,
    paidCount,
    pendingCount: rows.length - paidCount,
    pendingResellers: pendingResellers.size,
  };
}
