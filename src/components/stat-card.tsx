import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "primary" | "chart-2" | "chart-3" | "chart-5";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    "chart-2": "bg-chart-2/15 text-chart-2",
    "chart-3": "bg-chart-3/15 text-chart-3",
    "chart-5": "bg-chart-5/15 text-chart-5",
  };
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-pop">
      <div
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-30",
          toneMap[tone],
        )}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", toneMap[tone])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="relative mt-3 text-4xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="relative mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
