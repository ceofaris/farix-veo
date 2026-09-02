import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, PhoneCall, ShieldAlert, Sparkles } from "lucide-react";
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from "@/lib/support";
import { useAppSettings } from "@/hooks/use-app-settings";
import { cn } from "@/lib/utils";

/** King-editable number wins; the constant stays as a fallback. */
export function useSupportPhone() {
  const { settings } = useAppSettings();
  const phone = settings.support_phone?.trim() || SUPPORT_PHONE;
  const digits = phone.replace(/\D/g, "");
  return { phone, url: digits ? `https://wa.me/${digits}` : SUPPORT_WHATSAPP_URL };
}

function SupportLine() {
  const { phone, url } = useSupportPhone();
  return (
    <p className="mt-4 text-xs text-muted-foreground">
      Need premium access now? Call or WhatsApp{" "}
      <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-foreground underline underline-offset-4">
        {phone}
      </a>
    </p>
  );
}

export function UpgradeButton({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      hash="pricing"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 font-display text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-95",
        className,
      )}
    >
      <Sparkles className="h-4 w-4" /> Upgrade Now
    </Link>
  );
}

/** Full-page state for an account suspended by the multi-IP protection. */
export function SuspendedScreen() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-destructive/30 bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">Account suspended</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Account suspended due to multiple devices/IPs. Contact support.
        </p>
        <SupportLine />
      </div>
    </div>
  );
}

/** Full-page state once the trial or paid plan has run out. */
export function ExpiredScreen({ trial = false }: { trial?: boolean }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
          <Clock className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">Your plan is expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {trial
            ? "Your 1 hour free trial has ended. Upgrade to keep using Veo 3 and unlock Gemini Pro and Niche Prompts."
            : "Your access has ended. Upgrade to continue using Farix AI tools."}
        </p>
        <div className="mt-6">
          <UpgradeButton />
        </div>
        <SupportLine />
      </div>
    </div>
  );
}

/** Live countdown banner shown while a free trial is running. */
export function TrialBanner({ endsAt }: { endsAt: string }) {
  const [left, setLeft] = useState(() => new Date(endsAt).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => setLeft(new Date(endsAt).getTime() - Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  if (left <= 0) return null;
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-3 py-1 text-[11px] font-semibold text-white">
        <Clock className="h-3.5 w-3.5" /> Free trial
      </span>
      <span className="text-sm text-foreground">
        {mins}m {String(secs).padStart(2, "0")}s remaining — Veo 3 unlocked
      </span>
      <span className="text-xs text-muted-foreground">
        Purchase a plan to use Gemini Pro and Prompts
      </span>
      <UpgradeButton className="ml-auto px-4 py-2 text-xs" />
    </div>
  );
}

export function SupportContact() {
  const { phone } = useSupportPhone();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <PhoneCall className="h-3.5 w-3.5" /> {phone}
    </span>
  );
}
