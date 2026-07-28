
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ResellerFormDialog, ResellerRow } from "@/components/reseller-form-dialog";
import { useServerFn } from "@tanstack/react-start";
import { deleteAuthUser } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/resellers")({
  component: KingResellers,
});

type ResellerWithTools = ResellerRow & { reseller_tools: { tool_id: string; tools: { name: string } | null }[] };

function KingResellers() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ResellerRow | null>(null);
  const del = useServerFn(deleteAuthUser);

  const resellers = useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_active, expires_at, reseller_tools(tool_id, tools(name))")
        .eq("role", "reseller")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ResellerWithTools[];
    },
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this reseller? This removes their account.")) return;
    try {
      await del({ data: { id } });
      toast.success("Deleted");
      resellers.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Resellers"
        description="Manage reseller accounts, tool access and expiry."
        action={
          <Button size="lg" onClick={() => { setEditing(null); setOpen(true); }} className="shadow-soft transition-transform active:scale-[0.98]">
            <Plus className="w-4 h-4 mr-1.5" /> Create Reseller
          </Button>
        }
      />

      <TableShell>

          <thead className="bg-muted/60 text-muted-foreground text-left text-xs uppercase tracking-[0.08em]">
            <tr>
              <th className="px-5 py-3.5 font-semibold">Name</th>
              <th className="px-5 py-3.5 font-semibold">Email</th>
              <th className="px-5 py-3.5 font-semibold">Tools</th>
              <th className="px-5 py-3.5 font-semibold">Expires</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resellers.data?.map((r) => (
              <tr key={r.id} className="border-t border-border transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">{r.full_name || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-5 py-4 text-foreground/80">{r.email}</td>
                <td className="px-5 py-4 text-muted-foreground text-xs">
                  {r.reseller_tools?.length
                    ? r.reseller_tools.map((rt) => rt.tools?.name).filter(Boolean).join(", ")
                    : "—"}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-4">
                  <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-5 py-4 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {resellers.data?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-muted-foreground">No resellers.</td></tr>
            )}
          </tbody>
      </TableShell>


      <ResellerFormDialog open={open} onOpenChange={setOpen} reseller={editing} onSaved={() => resellers.refetch()} />
    </div>
  );
}
