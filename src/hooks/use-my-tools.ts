import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeToolsQuery, type ToolLite } from "@/lib/queries";
import { signedExtensionUrl } from "@/lib/extension";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export type Assignment = { tool_id: string; expires_at: string | null };
export type LatestVersion = { id: string; version: string; file_path: string; tool_id: string };

export function useMyTools() {
  const { profile, loading } = useProfile();
  const isUser = profile?.role === "user";

  const tools = useQuery({ ...activeToolsQuery, enabled: isUser });

  const access = useQuery({
    queryKey: ["my-tool-ids", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tools")
        .select("tool_id, expires_at")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as Assignment[];
    },
  });

  const versions = useQuery({
    queryKey: ["latest-extensions"],
    enabled: isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extension_versions")
        .select("id, version, file_path, tool_id")
        .eq("is_latest", true);
      if (error) throw error;
      return (data ?? []) as LatestVersion[];
    },
  });

  const toolList: ToolLite[] = tools.data ?? [];
  const assignments = new Map((access.data ?? []).map((a) => [a.tool_id, a]));

  function findTool(re: RegExp) {
    return toolList.find((t) => re.test(`${t.slug} ${t.name}`)) ?? null;
  }

  function expiryFor(re: RegExp): string | null {
    const t = findTool(re);
    const a = t ? assignments.get(t.id) : null;
    return a?.expires_at ?? profile?.expires_at ?? null;
  }

  async function downloadExtension(toolId?: string) {
    const list = versions.data ?? [];
    const v = (toolId && list.find((x) => x.tool_id === toolId)) || list[0];
    if (!v) return toast.error("No extension build available yet");
    const url = await signedExtensionUrl(v.file_path);
    if (!url) return toast.error("Could not create download link");
    window.open(url, "_blank");
  }

  return {
    profile,
    loading,
    isUser,
    tools: toolList,
    assignments,
    versions: versions.data ?? [],
    findTool,
    expiryFor,
    downloadExtension,
  };
}

export function formatDate(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-GB");
}
