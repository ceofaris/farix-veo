import { builtInToolLogo } from "@/lib/tool-logos";

export function ToolLogo({
  tool,
  className = "w-12 h-12",
}: {
  tool: { name: string; slug?: string | null };
  className?: string;
}) {
  const url = builtInToolLogo(tool);

  if (!url)
    return (
      <div
        className={`${className} rounded-xl bg-accent text-accent-foreground border border-border flex items-center justify-center text-sm font-semibold`}
      >
        {tool.name.slice(0, 2).toUpperCase()}
      </div>
    );

  return (
    <img
      src={url}
      alt={`${tool.name} logo`}
      loading="lazy"
      className={`${className} rounded-xl object-contain p-1.5 bg-background border border-border`}
    />
  );
}
