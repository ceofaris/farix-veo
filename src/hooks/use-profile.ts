import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "king" | "reseller" | "user";
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  status?: "active" | "suspended";
  trial_ends_at?: string | null;
  trial_used?: boolean;
  signup_source?: string;
};

export async function fetchProfile(): Promise<Profile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export function useProfile() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["current-profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    // A stale `null` (fetched before sign-in) must never be reused after login,
    // otherwise protected layouts hang on their "Loading…" branch forever.
    // Anything else is reused from cache instead of refetching on every mount.
    refetchOnMount: (q) => q.state.data == null,
    retry: 1,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") qc.setQueryData(["current-profile"], null);
      // TOKEN_REFRESHED fires hourly and on tab focus — refetching there was pure waste.
      if (event === "SIGNED_IN" || event === "USER_UPDATED")
        qc.invalidateQueries({ queryKey: ["current-profile"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);


  return {
    profile: query.data ?? null,
    loading: query.isPending || (query.isFetching && query.data === undefined),
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

