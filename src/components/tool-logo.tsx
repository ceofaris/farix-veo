import { builtInToolLogoInfo } from "@/lib/tool-logos";
import { assetUrl } from "@/lib/asset-url";
import flowMark from "@/assets/flow-mark.png.asset.json";
import chatgptMark from "@/assets/chatgpt-mark.png.asset.json";
import geminiMark from "@/assets/gemini-mark.png.asset.json";

/**
 * Fixed-tool marks. Flow + ChatGPT ship as black-on-transparent PNGs, so they
 * render dark on light theme and are inverted to white on dark theme.
 * Gemini keeps its original colors in both themes.
 */
const MARKS: Array<{
  match: RegExp;
  url: string;
  alt: string;
  invertOnDark: boolean;
  pad: string;
}> = [
  { match: /veo|flow/i, url: assetUrl(flowMark), alt: "Flow logo", invertOnDark: true, pad: "p-2" },
  { match: /chat\s*-?\s*gpt/i, url: assetUrl(chatgptMark), alt: "ChatGPT logo", invertOnDark: true, pad: "p-2" },
  { match: /gemini/i, url: assetUrl(geminiMark), alt: "Gemini logo", invertOnDark: false, pad: "p-1.5" },
];

export function ToolLogo({
  tool,
  className = "w-12 h-12",
}: {
  tool: { name: string; slug?: string | null };
  className?: string;
}) {
  const key = `${tool.slug ?? ""} ${tool.name ?? ""}`;
  const box = `${className} rounded-lg border border-border flex items-center justify-center shrink-0`;

  const mark = MARKS.find((m) => m.match.test(key));
  if (mark) {
    return (
      <div className={`${box} bg-white dark:bg-secondary ${mark.pad}`}>
        <img
          src={mark.url}
          alt={mark.alt}
          loading="lazy"
          className={`w-full h-full object-contain ${mark.invertOnDark ? "dark:invert" : ""}`}
        />
      </div>
    );
  }

  const logo = builtInToolLogoInfo(tool);
  if (logo) {
    const container = logo.container ?? "bg-background";
    return (
      <img
        src={logo.url}
        alt={`${tool.name} logo`}
        loading="lazy"
        className={`${className} rounded-lg border border-border ${container} ${logo.bleed ? "object-cover p-0" : "object-contain p-1.5"}`}
      />
    );
  }

  return (
    <div className={`${box} bg-accent text-accent-foreground text-sm font-semibold`}>
      {tool.name.slice(0, 2).toUpperCase()}
    </div>
  );
}
