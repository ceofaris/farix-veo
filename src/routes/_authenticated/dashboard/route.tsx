import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyTools } from "@/hooks/use-my-tools";
import { cn } from "@/lib/utils";
import { Download, Home, LogOut, Menu, Shield, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard/veo-3", label: "Veo 3" },
  { to: "/dashboard/chatgpt", label: "ChatGPT" },
] as const;

function DashboardLayout() {
  const { profile, loading, isUser, downloadExtension } = useMyTools();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role === "king") navigate({ to: "/king" });
    else if (profile.role === "reseller") navigate({ to: "/reseller" });
  }, [profile, loading, navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading || !profile) {
    return (
      <div className="farix-shell dark min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!isUser) return null;

  const initials = (profile.full_name || profile.email || "?").slice(0, 2).toUpperCase();

  const navClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
      active
        ? "bg-brand-gradient text-white shadow-glow"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    );

  return (
    <div className="farix-shell dark min-h-screen bg-background text-foreground flex">
      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-40 h-screen w-[230px] shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight tracking-tight">Farix</div>
            <div className="truncate text-xs text-muted-foreground">AI Workspace</div>
          </div>
          <button
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <Link to="/dashboard" onClick={() => setOpen(false)} className={navClass(path === "/dashboard")}>
            <Home className="h-4 w-4" /> Home
          </Link>
          <div className="px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tools
          </div>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={navClass(path === item.to)}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 text-xs">
              <div className="truncate font-medium">{profile.full_name || "Account"}</div>
              <div className="truncate text-muted-foreground">{profile.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-semibold lg:hidden">Farix</div>
          <button
            onClick={() => downloadExtension()}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
          >
            <Download className="h-4 w-4" /> Download Extension
          </button>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-5 sm:p-8">
          <Outlet />
        </main>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
