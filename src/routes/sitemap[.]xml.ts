import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://farixai.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/blog", changefreq: "daily", priority: "0.9" },
          { path: "/tools/veo-3-video-generation", changefreq: "weekly", priority: "0.9" },
          { path: "/tools/imagen-4-image-generation", changefreq: "weekly", priority: "0.9" },
          { path: "/tools/chatgpt-access", changefreq: "weekly", priority: "0.9" },
          { path: "/p/about-us", changefreq: "monthly", priority: "0.7" },
          { path: "/p/contact-us", changefreq: "monthly", priority: "0.7" },
          { path: "/p/privacy-policy", changefreq: "yearly", priority: "0.4" },
          { path: "/p/terms-and-conditions", changefreq: "yearly", priority: "0.4" },
          { path: "/p/disclaimer", changefreq: "yearly", priority: "0.4" },
        ];

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) {
                  headers.delete("Authorization");
                }
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });

          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("blogs")
              .select("slug, updated_at")
              .eq("status", "published")
              .order("created_at", { ascending: false })
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            entries.push(
              ...(data ?? []).map((post) => ({
                path: `/blog/${encodeURIComponent(post.slug as string)}`,
                lastmod: post.updated_at as string | undefined,
                changefreq: "monthly" as const,
                priority: "0.8",
              })),
            );
            if (!data || data.length < pageSize) break;
          }
        } catch {
          // Sitemap still serves static routes if the blog query fails.
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
