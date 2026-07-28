import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-neutral-900 border-r border-white/10 flex flex-col transform transition-transform",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <div className="text-lg font-semibold">Farix</div>
          <div className="text-xs text-neutral-500 mt-0.5">{title}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => {
            const active = path === it.to || path.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                  active
                    ? "bg-white text-black"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white",
                )}
              >
                <it.icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-neutral-300 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-neutral-950">
          <button onClick={() => setOpen(!open)} className="p-2 rounded hover:bg-white/5">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold">Farix</div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-neutral-900/80 border border-white/10 rounded-xl p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
