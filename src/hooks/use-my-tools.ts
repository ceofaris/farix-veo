import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeToolsQuery, planExpired, type ToolLite } from "@/lib/queries";
import { planDef, planIncludes, type PlanId } from "@/lib/plans";
import { signedExtensionUrl } from "@/lib/extension";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export type UserPlanRow = { id: string; plan: PlanId; expires_at: string; is_paid: boolean };
export type LatestVersion = { id: string; version: string; file_path: string; tool_id: string };

/** Plan-based access for the signed-in end user + the extension builds they can download. */
export function useMyTools() {
  const { profile, loading } = useProfile();
  const isUser = profile?.role === "user";

  const tools = useQuery({ ...activeToolsQuery, enabled: isUser });

  const plan = useQuery({
    queryKey: ["my-plan", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_plans")
        .select("id, plan, expires_at, is_paid")
        .eq("user_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as UserPlanRow) ?? null;
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
  const planId = plan.data?.plan ?? null;
  const planActive = !!profile?.is_active && !!expiresAt && !planExpired(expiresAt);

  const hasVeo = planActive && planIncludes(planId, "veo");
  const hasChatgpt = planActive && planIncludes(planId, "chatgpt");
  const hasPrompts = planActive && planIncludes(planId, "prompts");

  function findTool(re: RegExp) {
    return toolList.find((t) => re.test(`${t.slug} ${t.name}`)) ?? null;
  }

  /** One plan means one expiry for everything it unlocks. */
  function expiryFor(_re?: RegExp): string | null {
    return expiresAt;
  }

  async function downloadExtension(toolId?: string) {
    if (!planActive) return toast.error("Your plan is inactive — contact your reseller");
    const list = versions.data ?? [];
    const v = (toolId && list.find((x) => x.tool_id === toolId)) || list[0];
    if (!v) return toast.error("No extension build available yet");
    const url = await signedExtensionUrl(v.file_path);
    if (!url) return toast.error("Could not create download link");
    window.open(url, "_blank");
  }

  return {
    profile,
    loading: loading || plan.isLoading,
    isUser,
    tools: toolList,
    plan: plan.data ?? null,
    planId,
    planName: planDef(planId)?.name ?? null,
    planActive,
    /** kept for older call sites */
    hasMaster: planId === "master" && planActive,
    hasVeo,
    hasChatgpt,
    hasPrompts,
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
