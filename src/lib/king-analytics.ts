import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Pakistan (Asia/Karachi) calendar-day key: YYYY-MM-DD, day boundary at 12:00 AM PKT. */
const PKT = "Asia/Karachi";
const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: PKT,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const labelFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: PKT,
  day: "2-digit",
  month: "short",
});

export function pktDayKey(value: string | number | Date) {
  return dayFmt.format(new Date(value));
}

export function pktDayLabel(key: string) {
  // key is a PKT calendar date; render it at midday UTC to avoid tz drift.
  return labelFmt.format(new Date(`${key}T12:00:00Z`));
}

/** Last `days` PKT calendar-day keys, oldest → newest (includes today). */
export function lastPktDays(days: number) {
  const todayKey = pktDayKey(Date.now());
  const base = new Date(`${todayKey}T12:00:00Z`).getTime();
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

export type ProfileLite = {
  id: string;
  role: string;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  full_name: string | null;
  email: string;
};

/** One query for every profile-derived stat (users, resellers, daily chart). */
export const kingProfilesQuery = queryOptions({
  queryKey: ["king", "profiles"],
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  queryFn: async (): Promise<ProfileLite[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, is_active, expires_at, created_by, created_at, full_name, email")
      .in("role", ["user", "reseller"])
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data ?? []) as ProfileLite[];
  },
});

export type ToolAccountLite = { tool_id: string; is_active: boolean; status: string };

export const toolAccountsQuery = queryOptions({
  queryKey: ["king", "tool-accounts"],
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  queryFn: async (): Promise<ToolAccountLite[]> => {
    const { data, error } = await supabase
      .from("tool_accounts")
      .select("tool_id, is_active, status");
    if (error) throw error;
    return (data ?? []) as ToolAccountLite[];
  },
});

export type Investment = {
  id: string;
  label: string;
  amount: number;
  spent_on: string;
  note: string | null;
};

export const investmentsQuery = queryOptions({
  queryKey: ["king", "investments"],
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  queryFn: async (): Promise<Investment[]> => {
    const { data, error } = await supabase
      .from("investments")
      .select("id, label, amount, spent_on, note")
      .order("spent_on", { ascending: false })
      .limit(300);
    if (error) throw error;
    return (data ?? []).map((r) => ({ ...r, amount: Number(r.amount ?? 0) })) as Investment[];
  },
});

/** Current PKT month prefix, e.g. "2026-08". */
export function pktMonthKey(value: string | number | Date = Date.now()) {
  return pktDayKey(value).slice(0, 7);
}
