import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToolLogo } from "@/components/tool-logo";
import { signedExtensionUrl } from "@/lib/extension";
import { activeToolsQuery, describeTool } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Download, Lock, LogOut, Menu, Shield, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: UserOrRedirect,
  head: () => ({
    meta: [
      { title: "My Tools | Farix" },
      {
        name: "description",
        content: "Access ChatGPT and Veo 3 extensions assigned to your Farix account.",
      },
      { property: "og:title", content: "My Tools | Farix" },
      {
        property: "og:description",
        content: "Access ChatGPT and Veo 3 extensions assigned to your Farix account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type LatestVersion = {
  id: string;
  version: string;
  file_path: string;
  tool_id: string;
  notes: string | null;
};

function UserOrRedirect() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role === "king") navigate({ to: "/king" });
    else if (profile.role === "reseller") navigate({ to: "/reseller" });
  }, [profile, loading, navigate]);

  const isUser = profile?.role === "user";

  const tools = useQuery({ ...activeToolsQuery, enabled: isUser });

  const access = useQuery({
    queryKey: ["my-tool-ids", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tools")
        .select("tool_id, expires_at")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return (data ?? []) as { tool_id: string; expires_at: string | null }[];
    },
  });

  const versions = useQuery({
    queryKey: ["latest-extensions"],
    enabled: isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extension_versions")
        .select("id, version, file_path, tool_id, notes")
        .eq("is_latest", true);
      if (error) throw error;
      return (data ?? []) as LatestVersion[];
    },
  });

  async function download(path: string) {
    const url = await signedExtensionUrl(path);
    if (!url) return toast.error("Could not create download link");
    window.open(url, "_blank");
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!isUser) return null;

  const assignments = new Map((access.data ?? []).map((r) => [r.tool_id, r]));
  const cards = (tools.data ?? []).map((t) => ({
    tool: t,
    hasAccess: assignments.has(t.id),
    assignment: assignments.get(t.id) ?? null,
    version: (versions.data ?? []).find((v) => v.tool_id === t.id) ?? null,
  }));

  const initials = (profile.full_name || profile.email || "?").slice(0, 2).toUpperCase();

  function scrollToTool(id: string) {
    setMenuOpen(false);
    document.getElementById(`tool-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen inset-y-0 left-0 z-40 w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200",
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight tracking-tight">Farix</div>
            <div className="text-xs text-muted-foreground truncate">My Tools</div>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-md text-muted-foreground hover:bg-sidebar-accent"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Tools
          </div>
          {cards.map(({ tool, hasAccess }) => (
            <button
              key={tool.id}
              onClick={() => scrollToTool(tool.id)}
              className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <ToolLogo tool={tool} className="w-6 h-6" />
              <span className="truncate">{tool.name}</span>
              <span
                className={cn(
                  "ml-auto h-1.5 w-1.5 rounded-full",
                  hasAccess ? "bg-success" : "bg-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0 text-xs">
              <div className="font-medium truncate">{profile.full_name || "Account"}</div>
              <div className="text-muted-foreground truncate">{profile.email}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-semibold lg:hidden">Farix</div>
          <div className="hidden lg:block text-sm text-muted-foreground">
            Welcome back, {(profile.full_name || profile.email).split(" ")[0]}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1.5" /> Logout
            </Button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-5xl w-full mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight">My Tools</h1>
          <p className="mt-2 text-muted-foreground">
            Download the Farix extension for the tools assigned to you.
            {profile.expires_at && (
              <> Access valid until {new Date(profile.expires_at).toLocaleDateString()}.</>
            )}
          </p>

          {tools.isLoading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-56 rounded-2xl border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {cards.map(({ tool, hasAccess, version, assignment }) => (
                <div
                  key={tool.id}
                  id={`tool-${tool.id}`}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col gap-4 transition-all hover:shadow-pop"
                >
                  <div className="flex items-center gap-4">
                    <ToolLogo tool={tool} className="w-14 h-14" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-lg tracking-tight truncate">{tool.name}</h2>
                        {hasAccess ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-0.5 text-[11px] font-medium text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Lock className="h-3 w-3" /> Locked
                          </span>
                        )}
                      </div>
                      {version && hasAccess && (
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" /> Latest version v
                          {version.version}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {describeTool(tool)}
                  </p>

                  {hasAccess && assignment && (
                    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                          Access
                        </span>
                        <span className="text-sm font-semibold">Unlimited</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {assignment.expires_at
                          ? `Valid until ${new Date(assignment.expires_at).toLocaleDateString()}`
                          : "No expiry set"}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-1">
                    {!hasAccess ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Lock className="h-4 w-4 shrink-0" />
                        Contact your Reseller for access
                      </div>
                    ) : version ? (
                      <Button onClick={() => download(version.file_path)} className="w-full">
                        <Download className="h-4 w-4 mr-1.5" /> Download Extension
                      </Button>
                    ) : (
                      <Button disabled variant="secondary" className="w-full">
                        Extension not published yet
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
