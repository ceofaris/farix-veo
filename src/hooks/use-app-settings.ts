import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppSettings = {
  public_signup_enabled: boolean;
  google_only_signup: boolean;
  trial_minutes: number;
  max_login_ips: number;
  support_phone: string;
};

export const DEFAULT_SETTINGS: AppSettings = {
  public_signup_enabled: true,
  google_only_signup: true,
  trial_minutes: 60,
  max_login_ips: 3,
  support_phone: "",
};

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("public_signup_enabled, google_only_signup, trial_minutes, max_login_ips, support_phone")
    .maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) } as AppSettings;
}

export const APP_SETTINGS_KEY = ["app-settings"] as const;

/**
 * Public, King-editable platform settings (signup, trial length, IP limit, support).
 * `enabled: false` reads whatever is already cached without spending a request —
 * used by locked/expired screens that only need the support number.
 */
export function useAppSettings(enabled = true) {
  const query = useQuery({
    queryKey: APP_SETTINGS_KEY,
    queryFn: fetchAppSettings,
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
  return {
    settings: query.data ?? DEFAULT_SETTINGS,
    loading: query.isPending,
    refetch: query.refetch,
  };
}
