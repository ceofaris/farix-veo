import { Link } from "@tanstack/react-router";
import { Mail, ArrowRight } from "lucide-react";
import { FarixMark } from "@/components/farix-logo";
import { PAGE_LINKS, TOOL_LINKS } from "@/components/site-links";

const IMPORTANT_LINKS = [
  { label: "Home", href: "/#" },
  { label: "Pricing", href: "/#pricing" },
  { label: "How it works", href: "/#how" },
  { label: "FAQ", href: "/#faq" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <FarixMark className="h-6" />
              <span className="font-display text-lg font-bold tracking-tight text-foreground">Farix AI</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Managed access to premium AI tools — Veo 3, Gemini Pro, ChatGPT and image generation — through one
              secure, invite-only platform.
            </p>
            <a
              href="mailto:support@farixai.com"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4" /> support@farixai.com
            </a>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">Tools</h3>
            <ul className="mt-4 space-y-2.5">
              {TOOL_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">Pages</h3>
            <ul className="mt-4 space-y-2.5">
              {PAGE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-foreground">Important links</h3>
            <ul className="mt-4 space-y-2.5">
              {IMPORTANT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Sign In
                </Link>
              </li>
            </ul>
            <Link
              to="/auth"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98]"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Farix AI · All rights reserved</span>
          <span>Invite-only access platform · Not affiliated with Google or OpenAI</span>
        </div>
      </div>
    </footer>
  );
}
