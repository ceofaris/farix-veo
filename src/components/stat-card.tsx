import { Card } from "@/components/panel-layout";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone?: "primary" | "chart-2" | "chart-3" | "chart-5";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary/12 text-primary",
    "chart-2": "bg-chart-2/15 text-chart-2",
    "chart-3": "bg-chart-3/15 text-chart-3",
    "chart-5": "bg-chart-5/15 text-chart-5",
  };
  return (
    <Card className="relative overflow-hidden hover:shadow-pop transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-[0.12em]">
            {label}
          </div>
          <div className="text-3xl font-semibold mt-2 tracking-tight">{value}</div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
