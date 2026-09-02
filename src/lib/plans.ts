/** The three plans the platform sells. */
export type PlanId = "pro" | "master";

export type PlanFeature = "veo" | "gemini" | "prompts" | "whisk";

export type PlanDef = {
  id: PlanId;
  name: string;
  tagline: string;
  features: string[];
  includes: Record<PlanFeature, boolean>;
};

export const PLANS: PlanDef[] = [
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited Veo 3 video generation plus the full niche prompt library.",
    features: ["Veo 3 (Lite) — Unlimited", "Niche Prompts"],
    includes: { veo: true, gemini: false, prompts: true, whisk: false },
  },
  {
    id: "master",
    name: "Master",
    tagline: "Everything on Farix — Veo 3, Gemini Pro and Niche Prompts.",
    features: [
      "Veo 3 (Lite) — Unlimited",
      "Gemini Pro (Chat)",
      "Niche Prompts",
      "Whisk",
    ],
    includes: { veo: true, gemini: true, prompts: true, whisk: true },
  },
];

export const PLAN_IDS: PlanId[] = PLANS.map((p) => p.id);

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as string[]).includes(value);
}

export function planDef(id: string | null | undefined): PlanDef | null {
  return PLANS.find((p) => p.id === id) ?? null;
}

export function planName(id: string | null | undefined): string {
  return planDef(id)?.name ?? "—";
}

export function planIncludes(id: string | null | undefined, feature: PlanFeature): boolean {
  return planDef(id)?.includes[feature] ?? false;
}

/** Message shown on a dashboard section the current plan does not cover. */
export const LOCK_MESSAGE: Record<PlanFeature, string> = {
  veo: "Purchase a plan to use Veo 3 video generation",
  gemini: "Purchase a plan to use Gemini Pro and Prompts",
  prompts: "Purchase a plan to use Gemini Pro and Prompts",
  whisk: "Upgrade to the Master plan to use Whisk",
};
