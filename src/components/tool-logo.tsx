import { builtInToolLogoInfo } from "@/lib/tool-logos";

export function ToolLogo({
  tool,
  className = "w-12 h-12",
}: {
  tool: { name: string; slug?: string | null };
  className?: string;
}) {
  const logo = builtInToolLogoInfo(tool);

  if (!logo)
    return (
      <div
        className={`${className} rounded-xl bg-accent text-accent-foreground border border-border flex items-center justify-center text-sm font-semibold`}
      >
        {tool.name.slice(0, 2).toUpperCase()}
      </div>
    );

  const base = "rounded-xl border border-border";
  const container = logo.container ?? "bg-background";

  if (logo.bleed) {
    return (
      <img
        src={logo.url}
        alt={`${tool.name} logo`}
        loading="lazy"
        className={`${className} ${base} ${container} object-cover p-0`}
      />
    );
  }

  return (
    <img
      src={logo.url}
      alt={`${tool.name} logo`}
      loading="lazy"
      className={`${className} ${base} ${container} object-contain p-1.5`}
    />
  );
}
