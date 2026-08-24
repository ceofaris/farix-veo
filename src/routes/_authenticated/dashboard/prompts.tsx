import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { nichesQuery } from "@/lib/niches";
import { NicheImage } from "@/components/niche-image";
import { useMyTools } from "@/hooks/use-my-tools";
import { PlanLock } from "@/components/plan-lock";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/dashboard/prompts")({
  component: PromptsPage,
  head: () => ({
    meta: [
      { title: "Niche Prompts | Farix AI Workspace" },
      { name: "description", content: "Copy-ready niche prompt packs curated for Farix members." },
      { property: "og:title", content: "Niche Prompts | Farix AI Workspace" },
      { property: "og:description", content: "Copy-ready niche prompt packs curated for Farix members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function PromptsPage() {
  const { hasPrompts, loading } = useMyTools();
  const niches = useQuery({ ...nichesQuery, enabled: hasPrompts });
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!hasPrompts) return <PlanLock feature="prompts" title="Niche Prompts" />;

  const rows = (niches.data ?? []).filter(
    (n) => n.is_active && n.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Prompt copied");
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Niche Prompts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ready-to-use prompt packs. Copy one and paste it straight into your tool.
        </p>
      </header>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search niches"
          className="rounded-full pl-9"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((n) => (
          <article
            key={n.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-transform hover:-translate-y-0.5"
          >
            <NicheImage path={n.image_path} alt={n.name} className="h-40 w-full" />
            <div className="p-5">
              <h2 className="font-display font-semibold tracking-tight">{n.name}</h2>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                {n.prompt_text}
              </p>
              <button
                onClick={() => copy(n.id, n.prompt_text)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-gradient px-4 py-2 font-display text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
              >
                {copied === n.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === n.id ? "Copied" : "Copy Prompt"}
              </button>
            </div>
          </article>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No niche prompts published yet.</p>
        )}
      </div>
    </div>
  );
}
