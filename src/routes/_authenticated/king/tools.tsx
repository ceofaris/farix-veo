
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { Settings, Wrench, Globe } from "lucide-react";
import { ToolLogo } from "@/components/tool-logo";

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  is_active: boolean;
};

export const Route = createFileRoute("/_authenticated/king/tools")({
  component: KingTools,
});



function KingTools() {
  const tools = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const order = (t: ToolRow) => {
        const k = `${t.slug} ${t.name}`;
        if (/veo|flow/i.test(k)) return 0;
        if (/gemini/i.test(k)) return 1;
        return 2;
      };
      return (data as ToolRow[])
        .filter((t) => !/chat\s*-?\s*gpt/i.test(`${t.slug} ${t.name}`))
        .sort((a, b) => order(a) - order(b));
    },
  });

  return (
    <div>
      <PageHeader title="Tools" description="Veo 3 and Gemini Pro are the platform's fixed tools." />

      {tools.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {[0, 1].map((i) => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      )}

      {tools.data && tools.data.length === 0 && (
        <Card className="mt-6 py-16 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center">
            <Wrench className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">No tools available</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Veo 3 and Gemini Pro are configured at the platform level.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {tools.data?.map((t) => {
          const isFlow = /veo|flow/i.test(`${t.slug} ${t.name}`);
          return (
          <Card key={t.id} className="group hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start gap-4">
              <ToolLogo tool={t} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{isFlow ? "Veo 3 + Whisk (Flow)" : t.name}</h3>
                  <Badge
                    className={
                      t.is_active
                        ? "bg-success/15 text-success border-success/25 hover:bg-success/15"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted"
                    }
                    variant="outline"
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0" /> {t.domain}
                </p>
                {isFlow && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Same Flow cookies power Veo 3 and Whisk — one shared account pool.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-4 border-t border-border">
              <Button asChild size="sm" variant="secondary" className="flex-1">
                <Link to="/king/tools/$id" params={{ id: t.id }}>
                  <Settings className="w-4 h-4 mr-1" /> Manage Accounts
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
