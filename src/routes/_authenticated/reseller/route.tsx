import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { PanelLayout } from "@/components/panel-layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LayoutDashboard, Wrench, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reseller")({
  component: ResellerLayout,
});

function ResellerLayout() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const disabled = !!profile && profile.role === "reseller" && !profile.is_active;
  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role !== "reseller") {
      navigate({ to: "/dashboard" });
      return;
    }
    if (!profile.is_active) {
      (async () => {
        await supabase.auth.signOut();
        toast.error("Your reseller account has been disabled. Contact the administrator.");
        navigate({ to: "/auth", replace: true });
      })();
    }
  }, [profile, loading, navigate]);
  if (loading || !profile) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading…</div>;
  }
  if (profile.role !== "reseller" || disabled) return null;

  return (
    <PanelLayout
      title="Reseller Panel"
      items={[
        { to: "/reseller", label: "Dashboard", icon: LayoutDashboard },
        { to: "/reseller/tools", label: "My Tools", icon: Wrench },
        { to: "/reseller/users", label: "My Users", icon: Users },
      ]}
    >
      <Outlet />
    </PanelLayout>
  );
}
