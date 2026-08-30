import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader, TableShell } from "@/components/panel-layout";
import { allBlogsQuery, formatDate, slugify, type Blog } from "@/lib/blogs";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/king/blog")({
  component: KingBlog,
  head: () => ({
    meta: [
      { title: "Blog | Farix King Panel" },
      { name: "description", content: "Write, edit and publish Farix AI blog articles." },
      { property: "og:title", content: "Blog | Farix King Panel" },
      { property: "og:description", content: "Write, edit and publish Farix AI blog articles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Draft = {
  id?: string;
  title: string;
  slug: string;
  slugTouched: boolean;
  meta_title: string;
  meta_description: string;
  keywords: string;
  cover_image_url: string;
  excerpt: string;
  content: string;
  status: string;
};

const EMPTY: Draft = {
  title: "",
  slug: "",
  slugTouched: false,
  meta_title: "",
  meta_description: "",
  keywords: "",
  cover_image_url: "",
  excerpt: "",
  content: "",
  status: "draft",
};

function toDraft(p: Blog): Draft {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    slugTouched: true,
    meta_title: p.meta_title ?? "",
    meta_description: p.meta_description ?? "",
    keywords: p.keywords ?? "",
    cover_image_url: p.cover_image_url ?? "",
    excerpt: p.excerpt ?? "",
    content: p.content ?? "",
    status: p.status,
  };
}

function KingBlog() {
  const qc = useQueryClient();
  const posts = useQuery(allBlogsQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const rows = posts.data ?? [];

  async function handleDelete(p: Blog) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("blogs").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    qc.invalidateQueries({ queryKey: ["blogs"] });
  }

  async function save(status: "draft" | "published") {
    if (!draft) return;
    const title = draft.title.trim();
    const slug = slugify(draft.slug || draft.title);
    if (!title) return toast.error("Title is required");
    if (!slug) return toast.error("Slug is required");
    setSaving(true);
    const payload = {
      title,
      slug,
      content: draft.content,
      excerpt: draft.excerpt.trim() || null,
      meta_title: draft.meta_title.trim() || null,
      meta_description: draft.meta_description.trim() || null,
      keywords: draft.keywords.trim() || null,
      cover_image_url: draft.cover_image_url.trim() || null,
      status,
    };
    const res = draft.id
      ? await supabase.from("blogs").update(payload).eq("id", draft.id)
      : await supabase.from("blogs").insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(
        res.error.message.includes("blogs_slug_key")
          ? "That slug is already used by another post."
          : res.error.message,
      );
      return;
    }
    toast.success(status === "published" ? "Post published" : "Draft saved");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["blogs"] });
  }

  if (draft) return <BlogEditor draft={draft} setDraft={setDraft} save={save} saving={saving} />;

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Write and publish SEO articles for farixai.com/blog."
        action={
          <Button size="lg" onClick={() => setDraft({ ...EMPTY })}>
            <Plus className="mr-1.5 h-4 w-4" /> New Post
          </Button>
        }
      />

      <TableShell>
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Title</th>
            <th className="px-5 py-3">Slug</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Created</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                {posts.isLoading ? "Loading…" : "No posts yet. Create your first article."}
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="px-5 py-3 font-medium">{p.title}</td>
              <td className="px-5 py-3 text-muted-foreground">/blog/{p.slug}</td>
              <td className="px-5 py-3">
                <Badge variant={p.status === "published" ? "default" : "secondary"}>
                  {p.status === "published" ? "Published" : "Draft"}
                </Badge>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{formatDate(p.created_at)}</td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setDraft(toDraft(p))}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}

function Counter({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return (
    <span className={over ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
      {value.length}/{limit}
    </span>
  );
}

function BlogEditor({
  draft,
  setDraft,
  save,
  saving,
}: {
  draft: Draft;
  setDraft: (d: Draft | null) => void;
  save: (status: "draft" | "published") => void;
  saving: boolean;
}) {
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const previewSlug = useMemo(() => slugify(draft.slug || draft.title), [draft.slug, draft.title]);

  return (
    <div>
      <PageHeader
        title={draft.id ? "Edit post" : "New post"}
        description={previewSlug ? `/blog/${previewSlug}` : "Set a title to generate the URL."}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
            {draft.id && previewSlug && (
              <Button variant="outline" asChild>
                <a href={`/blog/${previewSlug}`} target="_blank" rel="noreferrer">
                  Preview
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={() => save("draft")} disabled={saving}>
              Save as Draft
            </Button>
            <Button onClick={() => save("published")} disabled={saving}>
              Publish Live
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) =>
                set({
                  title: e.target.value,
                  slug: draft.slugTouched ? draft.slug : slugify(e.target.value),
                })
              }
              placeholder="Veo 3 in Pakistan: complete guide"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Custom slug</Label>
            <Input
              id="slug"
              value={draft.slug}
              onChange={(e) => set({ slug: e.target.value, slugTouched: true })}
              placeholder="veo-3-pakistan"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              rows={2}
              value={draft.excerpt}
              onChange={(e) => set({ excerpt: e.target.value })}
              placeholder="Short summary shown on the blog listing."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              rows={22}
              className="font-mono text-[13px] leading-relaxed"
              value={draft.content}
              onChange={(e) => set({ content: e.target.value })}
              placeholder={"## Heading\n\nParagraph text with **bold** and [links](https://farixai.com).\n\n- Bullet one\n- Bullet two"}
            />
            <p className="text-xs text-muted-foreground">
              Supports # headings, **bold**, *italic*, `code`, lists, quotes and [links](url).
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-medium">SEO</h2>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_title">Meta title</Label>
              <Counter value={draft.meta_title} limit={60} />
            </div>
            <Input
              id="meta_title"
              value={draft.meta_title}
              onChange={(e) => set({ meta_title: e.target.value })}
              placeholder="Falls back to the post title"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="meta_description">Meta description</Label>
              <Counter value={draft.meta_description} limit={155} />
            </div>
            <Textarea
              id="meta_description"
              rows={3}
              value={draft.meta_description}
              onChange={(e) => set({ meta_description: e.target.value })}
              placeholder="Falls back to the excerpt"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="keywords">GEO keywords</Label>
            <Textarea
              id="keywords"
              rows={2}
              value={draft.keywords}
              onChange={(e) => set({ keywords: e.target.value })}
              placeholder="veo 3 pakistan, ai video karachi"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cover">Cover image URL</Label>
            <Input
              id="cover"
              value={draft.cover_image_url}
              onChange={(e) => set({ cover_image_url: e.target.value })}
              placeholder="https://…"
            />
            {draft.cover_image_url && (
              <img
                src={draft.cover_image_url}
                alt="Cover preview"
                className="mt-2 h-32 w-full rounded-xl object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
