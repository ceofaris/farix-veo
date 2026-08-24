import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { LOCK_MESSAGE, type PlanFeature } from "@/lib/plans";

/** Shown when the signed-in user's plan does not include a feature. */
export function PlanLock({ feature, title }: { feature: PlanFeature; title: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title} is locked</h1>
        <p className="mt-2 text-sm text-muted-foreground">{LOCK_MESSAGE[feature]}</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
