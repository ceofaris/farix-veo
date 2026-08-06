
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { Settings, Wrench, Globe } from "lucide-react";
import { signedLogoUrl } from "@/lib/logo";
import { builtInToolLogo } from "@/lib/tool-logos";

type ToolRow = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo_url: string | null;
  is_active: boolean;
};

export const Route = createFileRoute("/_authenticated/king/tools")({
  component: KingTools,
});

export function ToolLogo({
  tool,
  className = "w-12 h-12",
}: {
  tool: { name: string; slug?: string | null; logo_url?: string | null };
  className?: string;
}) {
  const builtIn = builtInToolLogo(tool);
  const [url, setUrl] = useState<string | null>(builtIn);
  useEffect(() => {
    if (builtIn) return;
    signedLogoUrl(tool.logo_url).then(setUrl);
  }, [builtIn, tool.logo_url]);
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


function KingTools() {
  const tools = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ToolRow[];
    },
  });

  return (
    <div>
      <PageHeader title="Tools" description="Veo 3 and ChatGPT are the platform's fixed tools." />

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
            Veo 3 and ChatGPT are configured at the platform level.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {tools.data?.map((t) => (
          <Card key={t.id} className="group hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start gap-4">
              <ToolLogo tool={t} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{t.name}</h3>
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
