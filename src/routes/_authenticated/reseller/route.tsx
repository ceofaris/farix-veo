import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { PanelLayout } from "@/components/panel-layout";
import { LayoutDashboard, Wrench, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reseller")({
  component: ResellerLayout,
});

function ResellerLayout() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "reseller") navigate({ to: "/dashboard" });
  }, [profile, loading, navigate]);
  if (loading || !profile) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading…</div>;
  }
  if (profile.role !== "reseller") return null;
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
