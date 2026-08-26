import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyTools } from "@/hooks/use-my-tools";
import { cn } from "@/lib/utils";
import { Home, LogOut, Menu, MessageSquare, Sparkles, X } from "lucide-react";
import { flowLogoUrl, geminiLogoUrl } from "@/lib/tool-logos";
import { FarixMark } from "@/components/farix-logo";
import { useTheme } from "@/hooks/use-theme";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

const FlowIcon = ({ className }: { className?: string }) => (
  <span
    className={cn(
      className,
      "inline-flex items-center justify-center overflow-hidden rounded-md bg-black ring-1 ring-border/40",
    )}
    aria-hidden
  >
    <img
      src={flowLogoUrl}
      alt=""
      className="h-[70%] w-[70%] object-contain"
    />
  </span>
);

const GeminiIcon = ({ className }: { className?: string }) => (
  <span
    className={cn(className, "inline-flex items-center justify-center overflow-hidden")}
    aria-hidden
  >
    <img src={geminiLogoUrl} alt="" className="h-full w-full object-contain" />
  </span>
);

const NAV = [
  { to: "/dashboard/veo-3", label: "Veo 3", icon: FlowIcon },
  { to: "/dashboard/chatgpt", label: "ChatGPT", icon: MessageSquare },
  { to: "/dashboard/gemini", label: "Gemini Pro", icon: GeminiIcon },
  { to: "/dashboard/prompts", label: "Niche Prompts", icon: Sparkles },
] as const;

function DashboardLayout() {
  const { profile, loading, isUser } = useMyTools();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const shell = cn("farix-shell min-h-screen bg-background text-foreground", theme === "dark" && "dark");

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (profile.role === "king") navigate({ to: "/king" });
    else if (profile.role === "reseller") navigate({ to: "/reseller" });
  }, [profile, loading, navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading) {
    return (
      <div className={cn(shell, "flex items-center justify-center")}>
        Loading…
      </div>
    );
  }
  if (!profile) {
    return (
      <div className={cn(shell, "flex items-center justify-center px-6 text-center text-sm text-muted-foreground")}>
        Redirecting…
      </div>
    );
  }
  if (!isUser) return null;


  const initials = (profile.full_name || profile.email || "?").slice(0, 2).toUpperCase();

  const navClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-sm font-medium tracking-tight transition-all",
      active
        ? "bg-brand-gradient text-white shadow-glow"
        : "text-muted-foreground hover:bg-[color-mix(in_oklab,#8b5cf6_12%,transparent)] hover:text-foreground",
    );

  return (
    <div className={cn(shell, "flex")}>
      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-40 h-screen w-[230px] shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center gap-3 px-5">
          <FarixMark className="h-7" />
          <div className="min-w-0">
            <div className="font-display font-semibold leading-tight tracking-tight">Farix</div>
            <div className="truncate text-[11px] text-muted-foreground">AI Workspace</div>
          </div>
          <button
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
          <Link to="/dashboard" onClick={() => setOpen(false)} className={navClass(path === "/dashboard")}>
            <Home className="h-[18px] w-[18px] shrink-0" /> Home
          </Link>
          <div className="px-3 pb-2 pt-5 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tools
          </div>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={navClass(path === item.to)}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
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
            <ThemeToggle className="ml-auto h-8 w-8" />
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="font-display font-semibold lg:hidden">Farix</div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-4 sm:px-8 sm:pt-5">
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
