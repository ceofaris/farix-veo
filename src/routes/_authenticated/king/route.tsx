import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { PanelLayout } from "@/components/panel-layout";
import { LayoutDashboard, Wrench, UserCog, FlaskConical, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/king")({
  component: KingLayout,
});

function KingLayout() {
  const { profile, loading, error } = useProfile();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!profile) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (profile.role !== "king") navigate({ to: "/dashboard" });
  }, [profile, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Loading…</div>;
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {error ? "Could not load your account. Please sign in again." : "Redirecting…"}
      </div>
    );
  }
  if (profile.role !== "king") return null;

  return (
    <PanelLayout
      title="King Panel"
      items={[
        { to: "/king", label: "Dashboard", icon: LayoutDashboard },
        { to: "/king/tools", label: "Tools", icon: Wrench },
        { to: "/king/resellers", label: "Resellers", icon: UserCog },
        { to: "/king/niches", label: "Niche Prompts", icon: Sparkles },
        { to: "/king/extension-lab", label: "Extension Lab", icon: FlaskConical },
      ]}
    >
      <Outlet />
    </PanelLayout>
  );
}
