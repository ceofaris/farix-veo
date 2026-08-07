import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToolLogo } from "@/components/tool-logo";
import { signedExtensionUrl } from "@/lib/extension";
import { activeToolsQuery } from "@/lib/queries";
import { Download, Lock, Shield } from "lucide-react";
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

const DESCRIPTIONS: Array<{ match: RegExp; text: string }> = [
  {
    match: /chat\s*-?\s*gpt/i,
    text: "Full ChatGPT access — GPT-5, Deep Research, Thinking mode, image creation and voice.",
  },
  {
    match: /veo/i,
    text: "Google Veo 3 video generation — cinematic AI video with native audio, straight from your browser.",
  },
];

function describe(tool: { name: string; slug: string }) {
  const key = `${tool.slug} ${tool.name}`;
  return (
    DESCRIPTIONS.find((d) => d.match.test(key))?.text ??
    "Premium AI tool access through the Farix browser extension."
  );
}

function UserOrRedirect() {
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !profile) return;
    if (profile.role === "king") navigate({ to: "/king" });
    else if (profile.role === "reseller") navigate({ to: "/reseller" });
  }, [profile, loading, navigate]);

  const isUser = profile?.role === "user";

  const tools = useQuery(activeToolsQuery);

  const access = useQuery({
    queryKey: ["my-tool-ids", profile?.id],
    enabled: !!profile && isUser,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_tools")
        .select("tool_id")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.tool_id as string);
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        Loading…
      </div>
    );
  }
  if (!isUser) return null;

  const allowed = new Set(access.data ?? []);
  const cards = (tools.data ?? []).map((t) => ({
    tool: t,
    hasAccess: allowed.has(t.id),
    version: (versions.data ?? []).find((v) => v.tool_id === t.id) ?? null,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-soft">
            <Shield className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">Farix</div>
            <div className="text-xs text-muted-foreground">My Tools</div>
          </div>
        </div>
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
          Your available tools and extensions.
          {profile.expires_at && (
            <> Access valid until {new Date(profile.expires_at).toLocaleDateString()}.</>
          )}
        </p>

        {tools.isLoading ? (
          <p className="mt-10 text-muted-foreground">Loading your tools…</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {cards.map(({ tool, hasAccess, version }) => (
              <div
                key={tool.id}
                className="rounded-2xl border border-border bg-card p-6 shadow-soft flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <ToolLogo tool={tool} className="w-14 h-14" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg tracking-tight truncate">{tool.name}</h2>
                      {hasAccess ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Locked
                        </span>
                      )}
                    </div>
                    {version && hasAccess && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Latest version v{version.version}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{describe(tool)}</p>

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
  );
}
