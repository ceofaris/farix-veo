/** The three plans the platform sells. */
export type PlanId = "pro" | "master";

export type PlanFeature = "veo" | "chatgpt" | "gemini" | "prompts";

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
    includes: { veo: true, chatgpt: false, gemini: false, prompts: true },
  },
  {
    id: "master",
    name: "Master",
    tagline: "Everything on Farix — Veo 3, Gemini Pro, ChatGPT and Niche Prompts.",
    features: [
      "Veo 3 (Lite) — Unlimited",
      "Gemini Pro (Chat)",
      "ChatGPT (Testing Phase — Limited Access)",
      "Niche Prompts",
    ],
    includes: { veo: true, chatgpt: true, gemini: true, prompts: true },
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
  veo: "Purchase Master plan to access Veo 3 and other features",
  chatgpt: "Purchase Master plan to access ChatGPT and other features",
  gemini: "Contact your Reseller for access",
  prompts: "Purchase a plan to access Niche Prompts",
};
