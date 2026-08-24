import { Router, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { htmlBlogPosts, pressItems, productCategories, products } from "../../shared/schema";

const router = Router();

const DEFAULT_SITE_URL = "https://www.bauhausproduction.com";
const MAX_URLS = 50_000;

type SitemapEntry = {
  path: string;
  lastmod?: Date | string | null;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(value?: Date | string | null): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function getSiteUrl(req: Request): string {
  const configured = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  const base = configured.startsWith("http") ? configured : `${req.protocol}://${configured}`;
  return base.replace(/\/$/, "");
}

function entryXml(siteUrl: string, entry: SitemapEntry): string {
  const path = entry.path.startsWith("/") ? entry.path : `/${entry.path}`;
  return [
    "  <url>",
    `    <loc>${xmlEscape(`${siteUrl}${path}`)}</loc>`,
    `    <lastmod>${formatLastmod(entry.lastmod)}</lastmod>`,
    `    <changefreq>${entry.changefreq}</changefreq>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ].join("\n");
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const entries: SitemapEntry[] = [
      { path: "/", changefreq: "weekly", priority: "1.0" },
      { path: "/shop", changefreq: "daily", priority: "0.9" },
      { path: "/about", changefreq: "monthly", priority: "0.7" },
      { path: "/team", changefreq: "monthly", priority: "0.6" },
      { path: "/contact", changefreq: "never", priority: "0.5" },
      { path: "/books", changefreq: "monthly", priority: "0.7" },
      { path: "/tv", changefreq: "monthly", priority: "0.7" },
      { path: "/film", changefreq: "monthly", priority: "0.7" },
      { path: "/publishing", changefreq: "monthly", priority: "0.7" },
      { path: "/foundation", changefreq: "monthly", priority: "0.6" },
      { path: "/training", changefreq: "monthly", priority: "0.6" },
      { path: "/events", changefreq: "weekly", priority: "0.6" },
      { path: "/press", changefreq: "weekly", priority: "0.6" },
      { path: "/catalogue", changefreq: "monthly", priority: "0.6" },
      { path: "/blog", changefreq: "weekly", priority: "0.7" },
    ];

    const [publishedProducts, activeCategories, blogPosts, publishedPress] = await Promise.all([
      db
        .select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products)
        .where(eq(products.status, "published"))
        .orderBy(desc(products.updatedAt)),
      db
        .select({ slug: productCategories.slug, updatedAt: productCategories.updatedAt })
        .from(productCategories)
        .where(eq(productCategories.isActive, true))
        .orderBy(desc(productCategories.updatedAt)),
      db
        .select({ slug: htmlBlogPosts.slug, updatedAt: htmlBlogPosts.updatedAt })
        .from(htmlBlogPosts)
        .orderBy(desc(htmlBlogPosts.updatedAt)),
      db
        .select({ slug: pressItems.slug, updatedAt: pressItems.updatedAt })
        .from(pressItems)
        .where(eq(pressItems.status, "published"))
        .orderBy(desc(pressItems.updatedAt)),
    ]);

    entries.push(
      ...activeCategories.map((category) => ({
        path: `/shop/${encodeURIComponent(category.slug)}`,
        lastmod: category.updatedAt,
        changefreq: "weekly" as const,
        priority: "0.8",
      })),
      ...publishedProducts.map((product) => ({
        path: `/shop/product/${encodeURIComponent(product.slug)}`,
        lastmod: product.updatedAt,
        changefreq: "weekly" as const,
        priority: "0.8",
      })),
      ...blogPosts.map((post) => ({
        path: `/blog/${encodeURIComponent(post.slug)}`,
        lastmod: post.updatedAt,
        changefreq: "monthly" as const,
        priority: "0.7",
      })),
      ...publishedPress.map((item) => ({
        path: `/press/${encodeURIComponent(item.slug)}`,
        lastmod: item.updatedAt,
        changefreq: "monthly" as const,
        priority: "0.6",
      })),
    );

    const siteUrl = getSiteUrl(req);
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries.slice(0, MAX_URLS).map((entry) => entryXml(siteUrl, entry)),
      "</urlset>",
    ].join("\n");

    res
      .status(200)
      .set({
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      })
      .send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).type("text/plain").send("Unable to generate sitemap");
  }
});

export default router;
