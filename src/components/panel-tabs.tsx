import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type TabItem = { to: string; label: string };

export function PanelTabs({ items }: { items: TabItem[] }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const best = items
    .filter((i) => path === i.to || path.startsWith(i.to + "/"))
    .sort((a, b) => b.to.length - a.to.length)[0];

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card/60 p-1 shadow-soft">
      {items.map((it) => {
        const active = best?.to === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              active
                ? "bg-accent text-accent-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
