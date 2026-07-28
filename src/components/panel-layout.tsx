import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ReactNode, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Menu, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProfile } from "@/hooks/use-profile";

export type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function PanelLayout({
  title,
  items,
  children,
}: {
  title: string;
  items: NavItem[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const initials = (profile?.full_name || profile?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen inset-y-0 left-0 z-40 w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight tracking-tight">Farix</div>
            <div className="text-xs text-muted-foreground truncate">{title}</div>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Menu
          </div>
          {items.map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <it.icon className="w-4 h-4 shrink-0" />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0 text-xs">
              <div className="font-medium truncate">{profile?.full_name || "Account"}</div>
              <div className="text-muted-foreground truncate">{profile?.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md">
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold lg:hidden">Farix</div>
          <div className="hidden lg:block text-sm text-muted-foreground">{title}</div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function Card({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-card transition-shadow",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 border border-border rounded-2xl bg-card shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}
