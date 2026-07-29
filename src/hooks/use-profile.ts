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
};

async function fetchProfile(): Promise<Profile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return (data as Profile) ?? null;
}

export function useProfile() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["current-profile"],
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") qc.setQueryData(["current-profile"], null);
      if (event === "SIGNED_IN" || event === "USER_UPDATED")
        qc.invalidateQueries({ queryKey: ["current-profile"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  return { profile: query.data ?? null, loading: query.isLoading };
}
