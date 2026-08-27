import { cn } from "@/lib/utils";
import { assetUrl } from "@/lib/asset-url";
import flowMark from "@/assets/flow-mark-v2.png.asset.json";
import chatgptMark from "@/assets/chatgpt-mark.png.asset.json";

/**
 * Sidebar tool icons — drawn as inline SVGs with currentColor so they stay
 * dark in light theme, light in dark theme, and white on the active
 * gradient pill. All share a 24 viewBox and matching stroke weight.
 */

type IconProps = { className?: string };

const base = "shrink-0";

/** Flow brand mark (Veo 3) — same asset as King Tools */
export function SidebarFlowIcon({ className }: IconProps) {
  return (
    <img
      src={assetUrl(flowMark)}
      alt=""
      aria-hidden
      className={cn(base, "h-[18px] w-[18px] object-contain dark:invert", className)}
    />
  );
}

/** Official ChatGPT mark — same asset as King Tools */
export function SidebarChatGptIcon({ className }: IconProps) {
  return (
    <img
      src={assetUrl(chatgptMark)}
      alt=""
      aria-hidden
      className={cn(base, "h-[18px] w-[18px] object-contain dark:invert", className)}
    />
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

/** Prompt library — three prompt lines with a spark star (Niche Prompts) */
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
      <path d="M4 6.5h11" />
      <path d="M4 10.5h9" />
      <path d="M4 14.5h7" />
      <path
        d="M18.6 7.8c.14 1 1.07 1.93 2.07 2.07-1 .14-1.93 1.07-2.07 2.07-.14-1-1.07-1.93-2.07-2.07 1-.14 1.93-1.07 2.07-2.07z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
