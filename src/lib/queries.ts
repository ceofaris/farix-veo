import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ToolLite = { id: string; name: string; slug: string };

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

/** Hard-coded marketing copy for the two fixed tools. */
const DESCRIPTIONS: Array<{ match: RegExp; text: string }> = [
  {
    match: /chat\s*-?\s*gpt/i,
    text: "Full ChatGPT access — GPT-5, Deep Research, Thinking mode, image creation and voice.",
  },
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
