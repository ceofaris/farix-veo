import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { blogExcerpt, formatDate, publishedBlogsQuery, readingTime, SITE_URL } from "@/lib/blogs";

const TITLE = "Farix AI Blog — Guides on Veo 3, Gemini and ChatGPT access";
const DESC =
  "Practical guides, tutorials and updates on premium AI tool access — Veo 3 video, Imagen 4 images, Gemini Pro and ChatGPT — from the Farix AI team.";

export const Route = createFileRoute("/blog/")({
  component: BlogIndex,
  head: () => ({
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/blog` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
});

function BlogIndex() {
  const posts = useQuery(publishedBlogsQuery);
  const [q, setQ] = useState("");

  // Marketing pages are light-theme only, matching the homepage.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    return () => {
      if (wasDark) {
        root.classList.add("dark");
        root.style.colorScheme = "dark";
      }
    };
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const all = posts.data ?? [];
    if (!needle) return all;
    return all.filter((p) =>
      `${p.title} ${p.keywords ?? ""} ${p.excerpt ?? ""}`.toLowerCase().includes(needle),
    );
  }, [posts.data, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section>
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-14 text-center sm:pt-20">
          <Reveal>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 font-sans text-xs font-medium tracking-wide text-muted-foreground">
              Farix Blog
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="mt-6 font-sans text-[2.1rem] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[3.25rem]">
              <span className="text-gradient-metallic">Guides &amp; updates</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{DESC}</p>
          </Reveal>
          <Reveal delay={220}>
            <div className="relative mx-auto mt-8 max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search articles…"
                aria-label="Search articles"
                className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        {posts.isLoading && <p className="py-16 text-center text-sm text-muted-foreground">Loading articles…</p>}
        {!posts.isLoading && list.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {q ? "No articles match your search." : "New articles are on the way — check back soon."}
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 5) * 60}>
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt={p.title}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(p.created_at)} · {readingTime(p)} min read
                  </span>
                  <h2 className="mt-2 font-display text-lg font-semibold leading-snug tracking-tight">{p.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {blogExcerpt(p)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Read article <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
