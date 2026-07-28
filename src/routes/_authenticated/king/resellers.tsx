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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resellers</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage reseller accounts and permissions.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Create Reseller
        </Button>
      </div>

      <div className="mt-6 border border-white/10 rounded-xl bg-neutral-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Tools</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resellers.data?.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-3">{r.full_name || <span className="text-neutral-500">—</span>}</td>
                <td className="px-4 py-3 text-neutral-300">{r.email}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs">
                  {r.reseller_tools?.length
                    ? r.reseller_tools.map((rt) => rt.tools?.name).filter(Boolean).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
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
              <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-500">No resellers.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ResellerFormDialog open={open} onOpenChange={setOpen} reseller={editing} onSaved={() => resellers.refetch()} />
    </div>
  );
}
