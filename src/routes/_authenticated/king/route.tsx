import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { PanelLayout } from "@/components/panel-layout";
import { LayoutDashboard, Wrench, UserCog, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/_authenticated/king")({
  component: KingLayout,
});

function KingLayout() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && profile.role !== "king") navigate({ to: "/dashboard" });
  }, [profile, loading, navigate]);
  if (loading || !profile) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading…</div>;
  }
  if (profile.role !== "king") return null;
  return (
    <PanelLayout
      title="King Panel"
      items={[
        { to: "/king", label: "Dashboard", icon: LayoutDashboard },
        { to: "/king/tools", label: "Tools", icon: Wrench },
        { to: "/king/resellers", label: "Resellers", icon: UserCog },
        { to: "/king/extension-lab", label: "Extension Lab", icon: FlaskConical },
      ]}
    >
      <Outlet />
    </PanelLayout>
  );
}
