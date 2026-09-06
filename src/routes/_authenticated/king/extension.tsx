import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/panel-layout";
import { ToolExtensionCard } from "@/components/tool-extension-card";

export const Route = createFileRoute("/_authenticated/king/extension")({
  component: KingExtensionPage,
  head: () => ({
    meta: [
      { title: "Master Extension — Farix King Panel" },
      {
        name: "description",
        content: "Upload the single Farix Master extension build served to every user.",
      },
      { property: "og:title", content: "Master Extension — Farix King Panel" },
      {
        property: "og:description",
        content: "Upload the single Farix Master extension build served to every user.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function KingExtensionPage() {
  // The Master build is stored against the Flow/Veo tool row — one package for all tools.
  const anchor = useQuery({
    queryKey: ["master-extension-anchor-tool"],
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tools")
        .select("id, slug, name")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const list = data ?? [];
      return (
        list.find((t) => /veo|flow/i.test(`${t.slug} ${t.name}`)) ?? list[0] ?? null
      );
    },
  });

  return (
    <div>
      <PageHeader
        title="Extension"
        description="One Master extension for Veo 3, Gemini Pro and Whisk. Upload here — this is the only build users can download, and access inside it follows each user's plan."
      />
      <div className="mt-5">
        {anchor.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : anchor.data ? (
          <ToolExtensionCard toolId={anchor.data.id} toolName="Master" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Add a tool first, then upload the Master extension.
          </p>
        )}
      </div>
    </div>
  );
}
