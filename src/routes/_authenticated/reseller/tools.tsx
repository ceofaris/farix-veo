import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/tool-logo";
import { activeToolsQuery, describeTool, MASTER_PLAN } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/reseller/tools")({
  component: ResellerPlan,
});

function ResellerPlan() {
  const tools = useQuery(activeToolsQuery);

  return (
    <div>
      <PageHeader
        title={MASTER_PLAN.name}
        description="The only plan you sell. Every user you create gets full Master access until their expiry date."
      />

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {MASTER_PLAN.features.map((f) => (
            <Badge key={f} variant="secondary" className="rounded-full px-3 py-1 text-sm">
              {f}
            </Badge>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{MASTER_PLAN.tagline}</p>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        {(tools.data ?? []).map((t) => (
          <Card key={t.id} className="transition-all hover:shadow-pop hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <ToolLogo tool={t} className="h-12 w-12" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{t.name}</div>
                  <Badge variant="default">Included</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{describeTool(t)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
