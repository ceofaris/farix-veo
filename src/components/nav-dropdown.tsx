import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavDropdown({
  label,
  links,
  mobile = false,
  onNavigate,
}: {
  label: string;
  links: { label: string; to: string }[];
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (mobile) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent"
        >
          {label}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="mb-1 ml-4 flex flex-col border-l border-border">
            {links.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                onClick={onNavigate}
                className="rounded-xl px-4 py-2.5 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {t.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-1/2 top-full -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="w-64 rounded-2xl border border-border bg-background p-1.5 shadow-card">
          {links.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="block rounded-xl px-4 py-2.5 font-sans text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
