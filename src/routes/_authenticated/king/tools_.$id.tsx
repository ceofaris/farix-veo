import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, Power } from "lucide-react";
import { AccountFormDialog, ToolAccountRow } from "@/components/account-form-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/tools_/$id")({
  component: KingToolAccounts,
});

function KingToolAccounts() {
  const { id } = Route.useParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ToolAccountRow | null>(null);
  const [search, setSearch] = useState("");

  const tool = useQuery({
    queryKey: ["tool", id],
    queryFn: async () => {
      const { data } = await supabase.from("tools").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const accounts = useQuery({
    queryKey: ["tool-accounts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_accounts")
        .select("*")
        .eq("tool_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ToolAccountRow[];
    },
  });

  const filtered = (accounts.data ?? []).filter((a) =>
    (a.label ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleActive(a: ToolAccountRow) {
    await supabase.from("tool_accounts").update({ is_active: !a.is_active }).eq("id", a.id);
    accounts.refetch();
  }

  async function deleteAccount(id: string) {
    if (!confirm("Delete this account?")) return;
    const { error } = await supabase.from("tool_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    accounts.refetch();
  }

  return (
    <div>
      <Link to="/king/tools" className="text-sm text-neutral-400 inline-flex items-center gap-1 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </Link>
      <div className="flex items-center justify-between mt-3">
        <div>
          <h1 className="text-2xl font-semibold">{tool.data?.name ?? "Tool"}</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage cookie accounts.</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Account
        </Button>
      </div>

      <Input
        placeholder="Search by label…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-4 max-w-sm bg-neutral-900 border-white/10"
      />

      <div className="mt-4 border border-white/10 rounded-xl overflow-hidden bg-neutral-900/60">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-white/5">
                <td className="px-4 py-3">{a.label || <span className="text-neutral-500">—</span>}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.is_active ? "default" : "secondary"}>
                    {a.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {new Date((a as unknown as { created_at: string }).created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => toggleActive(a)}>
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setDialogOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteAccount(a.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-neutral-500">
                  No accounts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        toolId={id}
        account={editing}
        onSaved={() => accounts.refetch()}
      />
    </div>
  );
}
