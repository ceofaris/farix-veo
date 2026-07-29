import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { signedExtensionUrl } from "@/lib/extension";
import { Download, Puzzle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: UserOrRedirect,
  head: () => ({
    meta: [
      { title: "My Extensions | Farix" },
      { name: "description", content: "Download the Farix browser extension for each tool assigned to your account." },
      { property: "og:title", content: "My Extensions | Farix" },
      { property: "og:description", content: "Download the Farix browser extension for each tool assigned to your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type AssignedTool = {
  tool_id: string;
  tools: { id: string; name: string; domain: string; logo_url: string | null } | null;
};

type LatestVersion = {
  id: string;
  version: string;
  file_path: string;
  tool_id: string | null;
  notes: string | null;
};

function UserOrRedirect() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role === "king") navigate({ to: "/king" });
    else if (profile.role === "reseller") navigate({ to: "/reseller" });
  }, [profile, loading, navigate]);

  const isUser = profile?.role === "user";

  const assigned = useQuery({
    queryKey: ["my-tools", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tools")
        .select("tool_id, tools(id, name, domain, logo_url)")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as unknown as AssignedTool[];
    },
  });

  const toolIds = (assigned.data ?? []).map((a) => a.tool_id);

  const latest = useQuery({
    queryKey: ["my-extensions", toolIds.join(",")],
    enabled: toolIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extension_versions")
        .select("id, version, file_path, tool_id, notes")
        .eq("is_latest", true)
        .in("tool_id", toolIds);
      if (error) throw error;
      return (data ?? []) as LatestVersion[];
    },
  });

  async function download(path: string) {
    const url = await signedExtensionUrl(path);
    if (!url) return toast.error("Could not create download link");
    window.open(url, "_blank");
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!isUser) return null;

  const cards = (assigned.data ?? []).map((a) => ({
    tool: a.tools,
    toolId: a.tool_id,
    version: (latest.data ?? []).find((v) => v.tool_id === a.tool_id) ?? null,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="font-semibold">Farix</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 px-6 py-10 max-w-5xl w-full mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome, {profile.full_name || profile.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Download the extension for each tool assigned to your account.
          {profile.expires_at && (
            <> Access valid until {new Date(profile.expires_at).toLocaleDateString()}.</>
          )}
        </p>

        {assigned.isLoading ? (
          <p className="mt-10 text-muted-foreground">Loading your tools…</p>
        ) : cards.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-14 text-center">
            <Puzzle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 font-medium">No tools assigned yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once a tool is assigned to your account, its extension will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {cards.map((c) => (
              <div
                key={c.toolId}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  {c.tool?.logo_url ? (
                    <img
                      src={c.tool.logo_url}
                      alt={`${c.tool.name} logo`}
                      className="h-10 w-10 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Puzzle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{c.tool?.name ?? "Tool"}</div>
                    <div className="text-xs text-muted-foreground">{c.tool?.domain}</div>
                  </div>
                  {c.version && <Badge className="ml-auto">v{c.version.version}</Badge>}
                </div>
                {c.version ? (
                  <Button onClick={() => download(c.version!.file_path)} className="w-full">
                    <Download className="h-4 w-4 mr-1.5" /> Download {c.tool?.name} Extension
                  </Button>
                ) : (
                  <Button disabled variant="secondary" className="w-full">
                    Extension not published yet
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
