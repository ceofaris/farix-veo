import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { LOCK_MESSAGE, type PlanFeature } from "@/lib/plans";
import { UpgradeButton, useSupportPhone } from "@/components/account-state";

/** Shown when the signed-in user's plan does not include a feature. */
export function PlanLock({ feature, title }: { feature: PlanFeature; title: string }) {
  const { phone, url } = useSupportPhone();
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title} is locked</h1>
        <p className="mt-2 text-sm text-muted-foreground">{LOCK_MESSAGE[feature]}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <UpgradeButton />
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-full border border-border bg-card px-5 py-2.5 font-display text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Back to Home
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Premium access support:{" "}
          <a href={SUPPORT_WHATSAPP_URL} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline underline-offset-4">
            {SUPPORT_PHONE}
          </a>
        </p>
      </div>
    </div>
  );
}
