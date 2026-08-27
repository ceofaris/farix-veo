import { cn } from "@/lib/utils";

/**
 * Sidebar tool icons — drawn as inline SVGs with currentColor so they stay
 * dark in light theme, light in dark theme, and white on the active
 * gradient pill. All share a 24 viewBox and matching stroke weight.
 */

type IconProps = { className?: string };

const base = "shrink-0";

/** Flow mark — smooth double swoosh (Veo 3) */
export function SidebarFlowIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      className={cn(base, className)}
      aria-hidden
    >
      <path d="M2.5 8.5c3-3.6 6 3.6 9.5 0s6 3.6 9.5 0" />
      <path d="M2.5 15.5c3-3.6 6 3.6 9.5 0s6 3.6 9.5 0" />
    </svg>
  );
}

/** ChatGPT knot — six interlocking rounded petals (official-style mark) */
export function SidebarChatGptIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      className={cn(base, className)}
      aria-hidden
    >
      <path d="M15.4 9.1a2.9 2.9 0 0 1 3.9 3.5l-3.8 2.2a2.9 2.9 0 0 1-5 0L6.7 12.6a2.9 2.9 0 0 1 3.9-3.5V4.7a2.9 2.9 0 0 1 5 0v4.4" opacity="0" />
      {/* hexagonal knot: 6 trapezoid petals rotated 60° */}
      <path d="M10.4 5.4h5.2l2.6 4.5-2.6 4.5h-5.2l-2.6-4.5z" />
      <path d="M10.4 5.4h5.2l2.6 4.5-2.6 4.5h-5.2l-2.6-4.5z" transform="rotate(60 13 9.9)" />
      <path d="M10.4 5.4h5.2l2.6 4.5-2.6 4.5h-5.2l-2.6-4.5z" transform="rotate(-60 13 9.9)" />
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

/** Prompt library — document sheet with spark overlay (Niche Prompts) */
export function SidebarPromptsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(base, className)}
      aria-hidden
    >
      <path d="M6 3.5h6l5 5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M12 3.5V9h5" />
      <path d="M8.4 12.8h4.2" />
      <path d="M8.4 16h3" />
      <path
        d="M17.6 13.2c.2 1.4 1.5 2.7 2.9 2.9-1.4.2-2.7 1.5-2.9 2.9-.2-1.4-1.5-2.7-2.9-2.9 1.4-.2 2.7-1.5 2.9-2.9z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
