import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db";
import { htmlBlogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/html" || file.originalname.endsWith(".html")) {
      cb(null, true);
    } else {
      cb(new Error("Only HTML files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/ping", (_req: Request, res: Response) => {
  res.json({ status: "ok", route: "html-blog", version: "2.0.0" });
});

router.get("/", async (_req: Request, res: Response) => {
  try {
    const posts = await db
      .select({
        id: htmlBlogPosts.id,
        slug: htmlBlogPosts.slug,
        title: htmlBlogPosts.title,
        description: htmlBlogPosts.description,
        category: htmlBlogPosts.category,
        publishedAt: htmlBlogPosts.publishedAt,
      })
      .from(htmlBlogPosts)
      .orderBy(htmlBlogPosts.publishedAt);
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authenticateToken, upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No HTML file provided" });

    const { title, slug, description, category } = req.body;
    if (!title || !slug) return res.status(400).json({ message: "Title and slug are required" });

    const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const htmlContent = req.file.buffer.toString("utf-8");

    const existing = await db
      .select({ id: htmlBlogPosts.id })
      .from(htmlBlogPosts)
      .where(eq(htmlBlogPosts.slug, safeSlug))
      .limit(1);

    let post;
    if (existing.length > 0) {
      const updated = await db
        .update(htmlBlogPosts)
        .set({ title, description: description || "", category: category || "General", htmlContent, updatedAt: new Date() })
        .where(eq(htmlBlogPosts.slug, safeSlug))
        .returning();
      post = updated[0];
    } else {
      const inserted = await db
        .insert(htmlBlogPosts)
        .values({ slug: safeSlug, title, description: description || "", category: category || "General", htmlContent })
        .returning();
      post = inserted[0];
    }

    res.json({ message: "Blog post published", post });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:slug", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const deleted = await db
      .delete(htmlBlogPosts)
      .where(eq(htmlBlogPosts.slug, slug))
      .returning({ id: htmlBlogPosts.id });

    if (deleted.length === 0) return res.status(404).json({ message: "Post not found" });
    res.json({ message: "Post deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
