import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { useAllowedPlans } from "@/hooks/use-allowed-plans";

export const Route = createFileRoute("/_authenticated/reseller/tools")({
  component: ResellerPlans,
});

function ResellerPlans() {
  const { plans, loading } = useAllowedPlans();

  return (
    <div>
      <PageHeader
        title="My Plans"
        description="The plans you are allowed to sell. Every user you create is assigned one of these."
      />

      {!loading && plans.length === 0 && (
        <Card className="mt-6 p-6 text-sm text-muted-foreground">
          No plans assigned yet — ask the administrator to assign plans to your account.
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        {plans.map((p) => (
          <Card key={p.id} className="p-6 transition-all hover:shadow-pop hover:-translate-y-0.5">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">{p.name}</div>
              <Badge variant="default">Assigned</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.features.map((f) => (
                <Badge key={f} variant="secondary" className="rounded-full px-3 py-1">
                  {f}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
