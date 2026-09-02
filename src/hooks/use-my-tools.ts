import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeToolsQuery, planExpired, type ToolLite } from "@/lib/queries";
import { planDef, planIncludes, type PlanId } from "@/lib/plans";
import { signedExtensionUrl } from "@/lib/extension";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export type UserPlanRow = { id: string; plan: PlanId; expires_at: string; is_paid: boolean };
export type LatestVersion = { id: string; version: string; file_path: string; tool_id: string };

const latestVersionsQuery = {
  queryKey: ["latest-extensions"] as const,
  staleTime: 10 * 60 * 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("extension_versions")
      .select("id, version, file_path, tool_id")
      .eq("is_latest", true);
    if (error) throw error;
    return (data ?? []) as LatestVersion[];
  },
};

/** Plan-based access for the signed-in end user + the extension builds they can download. */
export function useMyTools() {
  const { profile, loading } = useProfile();
  const qc = useQueryClient();
  const isUser = profile?.role === "user";

  const plan = useQuery({
    queryKey: ["my-plan", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 10 * 60 * 1000,
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

  const expiresAt = plan.data?.expires_at ?? profile?.expires_at ?? null;
  const planId = plan.data?.plan ?? null;
  const suspended = profile?.status === "suspended";
  const paidActive =
    !suspended && !!profile?.is_active && !!plan.data && !planExpired(plan.data.expires_at);

  const trialEndsAt = profile?.trial_ends_at ?? null;
  const trialActive =
    !suspended && !paidActive && !!profile?.is_active && !!trialEndsAt && !planExpired(trialEndsAt);
  const trialExpired = !!profile?.trial_used && !trialActive && !paidActive;

  const planActive = paidActive;
  const accessExpired = !suspended && !paidActive && !trialActive;

  // Only users who can actually open a tool need the tools table; locked,
  // expired and suspended accounts (incl. finished free trials) fetch nothing.
  const hasAccess = paidActive || trialActive;
  const tools = useQuery({ ...activeToolsQuery, enabled: isUser && hasAccess });
  const toolList: ToolLite[] = tools.data ?? [];

  const hasVeo = (paidActive && planIncludes(planId, "veo")) || trialActive;
  const hasGemini = paidActive && planIncludes(planId, "gemini");
  const hasPrompts = paidActive && planIncludes(planId, "prompts");
  const hasWhisk = paidActive && planIncludes(planId, "whisk");

  function findTool(re: RegExp) {
    return toolList.find((t) => re.test(`${t.slug} ${t.name}`)) ?? null;
  }

  /** One plan means one expiry for everything it unlocks. */
  function expiryFor(_re?: RegExp): string | null {
    return expiresAt;
  }

  async function downloadExtension(toolId?: string) {
    if (suspended) return toast.error("Account suspended — contact support");
    if (!hasVeo && !paidActive) return toast.error("Your plan is expired — upgrade to continue");
    // Fetched on demand (and cached): nobody pays a request for a button they never press.
    const list = await qc.fetchQuery(latestVersionsQuery).catch(() => [] as LatestVersion[]);
    const v = toolId ? list.find((x) => x.tool_id === toolId) : list[0];
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
    planName: planDef(planId)?.name ?? (trialActive ? "Free Trial" : null),
    planActive,
    suspended,
    trialActive,
    trialExpired,
    trialEndsAt,
    accessExpired,
    /** kept for older call sites */
    hasMaster: planId === "master" && planActive,
    hasVeo,
    hasGemini,
    hasPrompts,
    hasWhisk,
    expiresAt,
    versions: (qc.getQueryData(latestVersionsQuery.queryKey) as LatestVersion[] | undefined) ?? [],
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
