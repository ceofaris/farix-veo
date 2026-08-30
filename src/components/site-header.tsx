import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { FarixMark } from "@/components/farix-logo";
import { NavDropdown } from "@/components/nav-dropdown";
import { PAGE_LINKS, TOOL_LINKS } from "@/components/site-links";

const HASH_LINKS = [
  { label: "Home", href: "/#" },
  { label: "About", href: "/#how" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <FarixMark className="h-5 sm:h-6" />
          <span className="truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
            Farix AI
          </span>
        </Link>
        <div className="ml-auto hidden flex-1 items-center justify-center gap-1 md:flex">
          {HASH_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
          <NavDropdown label="Tools" links={TOOL_LINKS} />
          <NavDropdown label="Pages" links={PAGE_LINKS} />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <Link
            to="/auth"
            className="hidden rounded-full px-4 py-2 font-display text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-cta px-4 py-2 font-display text-xs font-semibold text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98] sm:px-5 sm:text-sm"
          >
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-accent md:hidden"
          >
            {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col">
            {HASH_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-foreground transition-colors hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
            <NavDropdown label="Tools" links={TOOL_LINKS} mobile onNavigate={() => setMenuOpen(false)} />
            <NavDropdown label="Pages" links={PAGE_LINKS} mobile onNavigate={() => setMenuOpen(false)} />
            <Link
              to="/auth"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-sans text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
