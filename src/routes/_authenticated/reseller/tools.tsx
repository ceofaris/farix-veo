import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/panel-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";
import { signedLogoUrl } from "@/lib/logo";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/reseller/tools")({
  component: ResellerTools,
});

function LogoImg({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { signedLogoUrl(path).then(setUrl); }, [path]);
  if (!url) return <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10" />;
  return <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover bg-white/5 border border-white/10" />;
}

function ResellerTools() {
  const { profile } = useProfile();
  const tools = useQuery({
    queryKey: ["reseller-tools", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reseller_tools")
        .select("tool_id, tools(id, name, domain, logo_url, is_active)")
        .eq("reseller_id", profile!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.tools).filter(Boolean) as {
        id: string; name: string; domain: string; logo_url: string | null; is_active: boolean;
      }[];
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">My Tools</h1>
      <p className="text-neutral-400 text-sm mt-1">Tools assigned to you by the admin.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {tools.data?.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start gap-4">
              <LogoImg path={t.logo_url} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{t.name}</h3>
                  <Badge variant={t.is_active ? "default" : "secondary"}>
                    {t.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400 truncate">{t.domain}</p>
              </div>
            </div>
            <Button asChild size="sm" variant="secondary" className="w-full mt-4">
              <Link to="/reseller/tools/$id" params={{ id: t.id }}>
                <Settings className="w-4 h-4 mr-1" /> Manage Accounts
              </Link>
            </Button>
          </Card>
        ))}
        {tools.data && tools.data.length === 0 && (
          <div className="col-span-full text-center text-neutral-500 py-12">
            No tools assigned yet.
          </div>
        )}
      </div>
    </div>
  );
}
