import { cn } from "@/lib/utils";

/**
 * Sidebar tool icons — drawn as inline SVGs with currentColor so they stay
 * dark in light theme, light in dark theme, and white on the active
 * gradient pill. All share a 24 viewBox and matching stroke weight.
 */

type IconProps = { className?: string };

const base = "shrink-0";

/** Flow-style wave mark (Veo 3) */
export function SidebarFlowIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={cn(base, className)}
      aria-hidden
    >
      <path d="M3.5 8.2c2.8-2.8 5.6 2.8 8.5 0 2.8-2.8 5.6 2.8 8.5 0" />
      <path d="M3.5 15.8c2.8-2.8 5.6 2.8 8.5 0 2.8-2.8 5.6 2.8 8.5 0" />
    </svg>
  );
}

/** Official-style ChatGPT knot (three interlocking rounded squares) */
export function SidebarChatGptIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      className={cn(base, className)}
      aria-hidden
    >
      <rect x="8.7" y="3.6" width="6.6" height="6.6" rx="1.9" />
      <rect x="8.7" y="3.6" width="6.6" height="6.6" rx="1.9" transform="rotate(60 12 12)" />
      <rect x="8.7" y="3.6" width="6.6" height="6.6" rx="1.9" transform="rotate(-60 12 12)" />
    </svg>
  );
}

/** Simple four-point spark (Gemini Pro) */
export function SidebarGeminiIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn(base, className)} aria-hidden>
      <path d="M12 3.4c.62 4.1 4.5 7.98 8.6 8.6-4.1.62-7.98 4.5-8.6 8.6-.62-4.1-4.5-7.98-8.6-8.6 4.1-.62 7.98-4.5 8.6-8.6z" />
    </svg>
  );
}

/** Prompt library: spark over list lines (Niche Prompts) */
export function SidebarPromptsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={cn(base, className)}
      aria-hidden
    >
      <path d="M4 7.5h7" />
      <path d="M4 12h9" />
      <path d="M4 16.5h6" />
      <path
        d="M16.6 12.8c.28 1.85 2.03 3.6 3.88 3.88-1.85.28-3.6 2.03-3.88 3.88-.28-1.85-2.03-3.6-3.88-3.88 1.85-.28 3.6-2.03 3.88-3.88z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
