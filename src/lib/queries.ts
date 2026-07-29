import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ToolLite = { id: string; name: string; slug: string; logo_url: string | null };

/** Shared, long-cached tools list — avoids refetching on every dialog open. */
export const activeToolsQuery = queryOptions({
  queryKey: ["tools", "active"],
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  queryFn: async (): Promise<ToolLite[]> => {
    const { data, error } = await supabase
      .from("tools")
      .select("id, name, slug, logo_url")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []) as ToolLite[];
  },
});

export const resellerToolIdsQuery = (resellerId: string | undefined) =>
  queryOptions({
    queryKey: ["reseller-tool-ids", resellerId],
    enabled: !!resellerId,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("reseller_tools")
        .select("tool_id")
        .eq("reseller_id", resellerId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.tool_id as string);
    },
  });
