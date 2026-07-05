import { Router, Request, Response } from "express";
import { db } from "../db";
import { articles, users, categories, articleTags, tags } from "../../shared/schema";
import { eq, desc, and, ilike, sql, SQL } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10", category, search, status = "published" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [];
    
    if (status === "published") {
      conditions.push(eq(articles.status, "published"));
    }
    
    if (category) {
      const [cat] = await db.select().from(categories).where(eq(categories.slug, category as string));
      if (cat) {
        conditions.push(eq(articles.categoryId, cat.id));
      }
    }

    if (search) {
      conditions.push(ilike(articles.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        featuredImageAlt: articles.featuredImageAlt,
        status: articles.status,
        isFeatured: articles.isFeatured,
        readingTime: articles.readingTime,
        viewCount: articles.viewCount,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        authorId: articles.authorId,
        authorName: users.name,
        authorImage: users.profileImage,
        categoryId: articles.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.publishedAt), desc(articles.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(whereClause);

    res.json({
      articles: articlesData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get articles error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const featuredArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        featuredImageAlt: articles.featuredImageAlt,
        readingTime: articles.readingTime,
        publishedAt: articles.publishedAt,
        authorName: users.name,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.isFeatured, true), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt))
      .limit(5);

    res.json(featuredArticles);
  } catch (error) {
    console.error("Get featured articles error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/category/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        readingTime: articles.readingTime,
        publishedAt: articles.publishedAt,
        authorName: users.name,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(and(eq(articles.categoryId, category.id), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt))
      .limit(limitNum)
      .offset(offset);

    res.json({ category, articles: articlesData });
  } catch (error) {
    console.error("Get category articles error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/author/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authorId = parseInt(id);
    const { page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const [author] = await db.select({
      id: users.id,
      name: users.name,
      bio: users.bio,
      profileImage: users.profileImage,
      socialLinks: users.socialLinks,
    }).from(users).where(eq(users.id, authorId));
    
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        featuredImage: articles.featuredImage,
        readingTime: articles.readingTime,
        publishedAt: articles.publishedAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(and(eq(articles.authorId, authorId), eq(articles.status, "published")))
      .orderBy(desc(articles.publishedAt))
      .limit(limitNum)
      .offset(offset);

    res.json({ author, articles: articlesData });
  } catch (error) {
    console.error("Get author articles error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const [article] = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        excerpt: articles.excerpt,
        content: articles.content,
        featuredImage: articles.featuredImage,
        featuredImageAlt: articles.featuredImageAlt,
        status: articles.status,
        isFeatured: articles.isFeatured,
        metaTitle: articles.metaTitle,
        metaDescription: articles.metaDescription,
        ogImage: articles.ogImage,
        readingTime: articles.readingTime,
        viewCount: articles.viewCount,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        authorId: users.id,
        authorName: users.name,
        authorBio: users.bio,
        authorImage: users.profileImage,
        authorSocialLinks: users.socialLinks,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.slug, slug));

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    await db.update(articles).set({ viewCount: (article.viewCount || 0) + 1 }).where(eq(articles.id, article.id));

    const articleTagsData = await db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagSlug: tags.slug,
      })
      .from(articleTags)
      .leftJoin(tags, eq(articleTags.tagId, tags.id))
      .where(eq(articleTags.articleId, article.id));

    const relatedArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        featuredImage: articles.featuredImage,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .where(
        and(
          eq(articles.categoryId, article.categoryId!),
          eq(articles.status, "published"),
          sql`${articles.id} != ${article.id}`
        )
      )
      .orderBy(desc(articles.publishedAt))
      .limit(3);

    res.json({
      ...article,
      tags: articleTagsData,
      relatedArticles,
    });
  } catch (error) {
    console.error("Get article error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor", "author"), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, excerpt, categoryId, tagIds, featuredImage, featuredImageAlt, status, isFeatured, metaTitle, metaDescription, ogImage, scheduledFor } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const slug = generateSlug(title);
    const readingTime = calculateReadingTime(content);

    const publishedAt = status === "published" ? new Date() : null;

    const [newArticle] = await db.insert(articles).values({
      title,
      slug,
      content,
      excerpt,
      categoryId: categoryId || null,
      featuredImage,
      featuredImageAlt,
      authorId: req.user!.id,
      status: status || "draft",
      isFeatured: isFeatured || false,
      metaTitle,
      metaDescription,
      ogImage,
      readingTime,
      publishedAt,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    }).returning();

    if (tagIds && tagIds.length > 0) {
      await db.insert(articleTags).values(
        tagIds.map((tagId: number) => ({
          articleId: newArticle.id,
          tagId,
        }))
      );
    }

    res.status(201).json(newArticle);
  } catch (error) {
    console.error("Create article error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", authenticateToken, requireRole("super_admin", "editor", "author"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);
    const { title, content, excerpt, categoryId, tagIds, featuredImage, featuredImageAlt, status, isFeatured, metaTitle, metaDescription, ogImage, scheduledFor } = req.body;

    const [existingArticle] = await db.select().from(articles).where(eq(articles.id, articleId));

    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (req.user!.role === "author" && existingArticle.authorId !== req.user!.id) {
      return res.status(403).json({ message: "You can only edit your own articles" });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (title) {
      updates.title = title;
      updates.slug = generateSlug(title);
    }
    if (content) {
      updates.content = content;
      updates.readingTime = calculateReadingTime(content);
    }
    if (excerpt !== undefined) updates.excerpt = excerpt;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (featuredImageAlt !== undefined) updates.featuredImageAlt = featuredImageAlt;
    if (status) {
      updates.status = status;
      if (status === "published" && existingArticle.status !== "published") {
        updates.publishedAt = new Date();
      }
    }
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;
    if (metaTitle !== undefined) updates.metaTitle = metaTitle;
    if (metaDescription !== undefined) updates.metaDescription = metaDescription;
    if (ogImage !== undefined) updates.ogImage = ogImage;
    if (scheduledFor !== undefined) updates.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;

    const [updatedArticle] = await db.update(articles).set(updates).where(eq(articles.id, articleId)).returning();

    if (tagIds) {
      await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
      if (tagIds.length > 0) {
        await db.insert(articleTags).values(
          tagIds.map((tagId: number) => ({
            articleId,
            tagId,
          }))
        );
      }
    }

    res.json(updatedArticle);
  } catch (error) {
    console.error("Update article error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const articleId = parseInt(id);

    const [existingArticle] = await db.select().from(articles).where(eq(articles.id, articleId));

    if (!existingArticle) {
      return res.status(404).json({ message: "Article not found" });
    }

    await db.delete(articleTags).where(eq(articleTags.articleId, articleId));
    await db.delete(articles).where(eq(articles.id, articleId));

    res.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Delete article error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor", "author"), async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "10", status, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [];
    
    if (req.user!.role === "author") {
      conditions.push(eq(articles.authorId, req.user!.id));
    }
    
    if (status && status !== "all") {
      conditions.push(eq(articles.status, status as any));
    }

    if (search) {
      conditions.push(ilike(articles.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const articlesData = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        status: articles.status,
        isFeatured: articles.isFeatured,
        viewCount: articles.viewCount,
        publishedAt: articles.publishedAt,
        createdAt: articles.createdAt,
        authorName: users.name,
        categoryName: categories.name,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(whereClause)
      .orderBy(desc(articles.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(whereClause);

    res.json({
      articles: articlesData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get admin articles error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
