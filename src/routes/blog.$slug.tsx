import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Facebook, ListTree, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  blogBySlugQuery,
  blogExcerpt,
  extractHeadings,
  formatDate,
  publishedBlogsQuery,
  readingTime,
  relatedPosts,
  renderMarkdown,
  SITE_URL,
  type Blog,
} from "@/lib/blogs";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
  head: ({ params, loaderData }) => {
    const post = loaderData as Blog | undefined;
    const url = `${SITE_URL}/blog/${params.slug}`;
    if (!post) {
      return {
        links: [{ rel: "canonical", href: url }],
        meta: [
          { title: "Article | Farix AI Blog" },
          { name: "description", content: "Read the latest guides and updates from the Farix AI team." },
          { property: "og:title", content: "Article | Farix AI Blog" },
          { property: "og:description", content: "Read the latest guides and updates from the Farix AI team." },
          { property: "og:type", content: "article" },
          { property: "og:url", content: url },
          { name: "twitter:card", content: "summary_large_image" },
        ],
      };
    }
    const title = post.meta_title || post.title;
    const description = post.meta_description || blogExcerpt(post);
    return {
      links: [{ rel: "canonical", href: url }],
      meta: [
        { title },
        { name: "description", content: description },
        ...(post.keywords ? [{ name: "keywords", content: post.keywords }] : []),
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(post.cover_image_url ? [{ property: "og:image", content: post.cover_image_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(post.cover_image_url ? [{ name: "twitter:image", content: post.cover_image_url }] : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description,
            image: post.cover_image_url || undefined,
            datePublished: post.created_at,
            dateModified: post.updated_at,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: "Farix AI", url: SITE_URL },
            publisher: { "@type": "Organization", name: "Farix AI", url: SITE_URL },
          }),
        },
      ],
    };
  },
  loader: async ({ params, context }) => {
    const post = await context.queryClient.ensureQueryData(blogBySlugQuery(params.slug));
    if (!post || post.status !== "published") throw notFound();
    return post;
  },
  errorComponent: () => <BlogMissing message="This article could not be loaded." />,
  notFoundComponent: () => <BlogMissing message="This article does not exist or is not published yet." />,
});

function Shell({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

function BlogMissing({ message }: { message: string }) {
  return (
    <Shell>
      <div className="mx-auto max-w-2xl px-5 py-28 text-center">
        <h1 className="font-sans text-3xl font-bold tracking-[-0.03em]">Article not found</h1>
        <p className="mt-4 text-muted-foreground">{message}</p>
        <Link
          to="/blog"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-cta px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90"
        >
          Back to blog <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Shell>
  );
}

function BlogPost() {
  const post = Route.useLoaderData() as Blog;
  const others = useQuery(publishedBlogsQuery);
  const html = useMemo(() => renderMarkdown(post.content), [post.content]);
  const related = (others.data ?? []).filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <Shell>
      <article className="mx-auto max-w-3xl px-5 pb-16 pt-12 sm:pt-16">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>

        <h1 className="mt-6 font-sans text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] sm:text-[2.75rem]">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">{formatDate(post.created_at)}</p>

        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="mt-8 w-full rounded-2xl border border-border object-cover shadow-card"
          />
        )}

        <div
          className="farix-article mt-10 text-[1.02rem] leading-[1.85] text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <div className="mt-14 rounded-2xl border border-border bg-card p-7 text-center shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
            Try Farix AI today
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            One plan unlocks Veo 3 video, Gemini Pro and ChatGPT through the secure Farix browser extension.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-cta px-6 py-3 font-display text-sm font-semibold text-primary-foreground shadow-card transition hover:opacity-90 active:scale-[0.98]"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="font-display text-lg font-semibold tracking-tight">Related articles</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.title} loading="lazy" className="h-36 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs text-muted-foreground">{formatDate(p.created_at)}</span>
                  <h3 className="mt-2 font-display text-base font-semibold leading-snug tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {blogExcerpt(p)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}
