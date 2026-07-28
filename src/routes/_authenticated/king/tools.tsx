import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/panel-layout";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Settings, Wrench, Globe } from "lucide-react";
import { ToolFormDialog, ToolRow } from "@/components/tool-form-dialog";
import { signedLogoUrl } from "@/lib/logo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/tools")({
  component: KingTools,
});

function LogoImg({ path, name }: { path: string | null; name: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    signedLogoUrl(path).then(setUrl);
  }, [path]);
  if (!url)
    return (
      <div className="w-12 h-12 rounded-xl bg-accent text-accent-foreground border border-border flex items-center justify-center text-sm font-semibold">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  return (
    <img
      src={url}
      alt={`${name} logo`}
      className="w-12 h-12 rounded-xl object-cover bg-muted border border-border"
    />
  );
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
      <PageHeader
        title="Tools"
        description="All tools available on the platform."
        action={
          <Button
            size="lg"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="shadow-soft transition-transform active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Tool
          </Button>
        }
      />

      {tools.isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      )}

      {tools.data && tools.data.length === 0 && (
        <Card className="mt-6 py-16 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center">
            <Wrench className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold">No tools yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            Add your first tool to start managing cookie accounts and assigning access to resellers.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Tool
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
        {tools.data?.map((t) => (
          <Card key={t.id} className="group hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start gap-4">
              <LogoImg path={t.logo_url} name={t.name} />
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
              <Button
                size="sm"
                variant="ghost"
                aria-label="Edit tool"
                onClick={() => {
                  setEditing(t);
                  setDialogOpen(true);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Delete tool"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteTool(t.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
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
