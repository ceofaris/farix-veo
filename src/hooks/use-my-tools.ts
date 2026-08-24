import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeToolsQuery, planExpired, type ToolLite } from "@/lib/queries";
import { signedExtensionUrl } from "@/lib/extension";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export type MasterPlanRow = { id: string; expires_at: string; is_paid: boolean };
export type LatestVersion = { id: string; version: string; file_path: string; tool_id: string };

/** Master plan access for the signed-in end user + the extension builds they can download. */
export function useMyTools() {
  const { profile, loading } = useProfile();
  const isUser = profile?.role === "user";

  const tools = useQuery({ ...activeToolsQuery, enabled: isUser });

  const plan = useQuery({
    queryKey: ["my-master-plan", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plans")
        .select("id, expires_at, is_paid")
        .eq("user_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as MasterPlanRow) ?? null;
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
  const expiresAt = plan.data?.expires_at ?? profile?.expires_at ?? null;
  const hasMaster = !!profile?.is_active && !!expiresAt && !planExpired(expiresAt);

  function findTool(re: RegExp) {
    return toolList.find((t) => re.test(`${t.slug} ${t.name}`)) ?? null;
  }

  /** Master plan is one expiry for everything. */
  function expiryFor(_re?: RegExp): string | null {
    return expiresAt;
  }

  async function downloadExtension(toolId?: string) {
    if (!hasMaster) return toast.error("Your Master plan is inactive — contact your reseller");
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
    plan: plan.data ?? null,
    hasMaster,
    expiresAt,
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
