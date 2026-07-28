import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";
import { ToolFormDialog, ToolRow } from "@/components/tool-form-dialog";
import { signedLogoUrl } from "@/lib/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/tools")({
  component: KingTools,
});

function LogoImg({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    signedLogoUrl(path).then(setUrl);
  }, [path]);
  if (!url) return <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10" />;
  return <img src={url} alt="" className="w-12 h-12 rounded-lg object-cover bg-white/5 border border-white/10" />;
}

function KingTools() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ToolRow | null>(null);

  const tools = useQuery({
    queryKey: ["tools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tools").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ToolRow[];
    },
  });

  async function deleteTool(id: string) {
    if (!confirm("Delete this tool and all its accounts?")) return;
    const { error } = await supabase.from("tools").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    tools.refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tools</h1>
          <p className="text-neutral-400 text-sm mt-1">All tools available on the platform.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add New Tool
        </Button>
      </div>

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
            <div className="flex gap-2 mt-4">
              <Button asChild size="sm" variant="secondary" className="flex-1">
                <Link to="/king/tools/$id" params={{ id: t.id }}>
                  <Settings className="w-4 h-4 mr-1" /> Manage
                </Link>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => deleteTool(t.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
        {tools.data && tools.data.length === 0 && (
          <div className="col-span-full text-center text-neutral-500 py-12">No tools yet.</div>
        )}
      </div>

      <ToolFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tool={editing}
        onSaved={() => tools.refetch()}
      />
    </div>
  );
}
