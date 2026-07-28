import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: UserOrRedirect,
});

function UserOrRedirect() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role === "king") navigate({ to: "/king" });
    else if (profile.role === "reseller") navigate({ to: "/reseller" });
  }, [profile, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (profile.role !== "user") return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0">
        <div className="font-semibold">Farix</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        <Button
          variant="ghost"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          Logout
        </Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-semibold">Welcome, {profile.full_name || profile.email}</h1>
          <p className="mt-4 text-muted-foreground">Your tools will appear here.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Extension integration coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
