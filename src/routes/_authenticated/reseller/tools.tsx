import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, PageHeader } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { ToolLogo } from "@/components/tool-logo";
import { describeTool } from "@/lib/queries";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/reseller/tools")({
  component: ResellerTools,
});

type Tool = { id: string; name: string; slug: string; domain: string; is_active: boolean };

function ResellerTools() {
  const { profile } = useProfile();
  const tools = useQuery({
    queryKey: ["reseller-tools", profile?.id],
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reseller_tools")
        .select("tool_id, tools(id, name, slug, domain, is_active)")
        .eq("reseller_id", profile!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.tools).filter(Boolean) as unknown as Tool[];
    },
  });

  return (
    <div>
      <PageHeader
        title="My Tools"
        description="Tools the admin has granted you. You can assign these to your users."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
        {tools.data?.map((t) => (
          <Card key={t.id} className="transition-all hover:shadow-pop hover:-translate-y-0.5">
            <div className="flex items-start gap-4">
              <ToolLogo tool={t} className="w-14 h-14" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{t.name}</h3>
                  <Badge
                    variant="outline"
                    className={
                      t.is_active
                        ? "bg-success/15 text-success border-success/25"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t.domain}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">{describeTool(t)}</p>
          </Card>
        ))}
        {tools.data && tools.data.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-12">
            No tools assigned yet. Contact the admin.
          </div>
        )}
      </div>
    </div>
  );
}
