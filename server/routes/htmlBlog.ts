import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db";
import { htmlBlogPosts } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const htmlUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "file") {
      if (file.mimetype === "text/html" || file.originalname.endsWith(".html")) {
        cb(null, true);
      } else {
        cb(new Error("Only HTML files are allowed for the file field"));
      }
    } else if (file.fieldname === "thumbnail") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed for the thumbnail field"));
      }
    } else {
      cb(null, false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

function saveThumbnail(buffer: Buffer, originalName: string): string {
  const ext = path.extname(originalName) || ".jpg";
  const filename = `thumb-${Date.now()}${ext}`;
  const dir = path.resolve(__dirname, "../../uploads/thumbnails");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`[html-blog] saved thumbnail: ${filePath} (${buffer.length} bytes)`);
    return `/uploads/thumbnails/${filename}`;
  } catch (error: any) {
    console.error(`[html-blog] FAILED to save thumbnail to ${dir}:`, error.message);
    throw new Error(`Could not save thumbnail: ${error.message}`);
  }
}

router.get("/ping", (_req: Request, res: Response) => {
  res.json({ status: "ok", route: "html-blog", version: "2.0.0" });
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const rows = await db
      .select({
        id: htmlBlogPosts.id,
        slug: htmlBlogPosts.slug,
        title: htmlBlogPosts.title,
        description: htmlBlogPosts.description,
        category: htmlBlogPosts.category,
        thumbnailUrl: htmlBlogPosts.thumbnailUrl,
        publishedAt: htmlBlogPosts.publishedAt,
        htmlContent: htmlBlogPosts.htmlContent,
      })
      .from(htmlBlogPosts)
      .where(eq(htmlBlogPosts.slug, slug))
      .limit(1);
    if (rows.length === 0) return res.status(404).json({ message: "Post not found" });
    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
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
        thumbnailUrl: htmlBlogPosts.thumbnailUrl,
        publishedAt: htmlBlogPosts.publishedAt,
      })
      .from(htmlBlogPosts)
      .orderBy(htmlBlogPosts.publishedAt);
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/",
  authenticateToken,
  htmlUpload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>;
      if (!files?.file?.[0]) return res.status(400).json({ message: "No HTML file provided" });

      const { title, slug, description, category } = req.body;
      if (!title || !slug) return res.status(400).json({ message: "Title and slug are required" });

      const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
      const htmlContent = files.file[0].buffer.toString("utf-8");

      let thumbnailUrl: string | null = null;
      if (files?.thumbnail?.[0]) {
        thumbnailUrl = saveThumbnail(files.thumbnail[0].buffer, files.thumbnail[0].originalname);
      }

      const existing = await db
        .select({ id: htmlBlogPosts.id, thumbnailUrl: htmlBlogPosts.thumbnailUrl })
        .from(htmlBlogPosts)
        .where(eq(htmlBlogPosts.slug, safeSlug))
        .limit(1);

      let post;
      if (existing.length > 0) {
        const updateData: any = {
          title,
          description: description || "",
          category: category || "General",
          htmlContent,
          updatedAt: new Date(),
        };
        if (thumbnailUrl !== null) updateData.thumbnailUrl = thumbnailUrl;

        const updated = await db
          .update(htmlBlogPosts)
          .set(updateData)
          .where(eq(htmlBlogPosts.slug, safeSlug))
          .returning();
        post = updated[0];
      } else {
        const inserted = await db
          .insert(htmlBlogPosts)
          .values({
            slug: safeSlug,
            title,
            description: description || "",
            category: category || "General",
            thumbnailUrl,
            htmlContent,
          })
          .returning();
        post = inserted[0];
      }

      res.json({ message: "Blog post published", post });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put(
  "/:slug/thumbnail",
  authenticateToken,
  htmlUpload.fields([{ name: "thumbnail", maxCount: 1 }]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { slug } = req.params;
      const files = req.files as Record<string, Express.Multer.File[]>;
      if (!files?.thumbnail?.[0]) return res.status(400).json({ message: "No thumbnail image provided" });

      const existing = await db
        .select({ id: htmlBlogPosts.id })
        .from(htmlBlogPosts)
        .where(eq(htmlBlogPosts.slug, slug))
        .limit(1);
      if (existing.length === 0) return res.status(404).json({ message: "Post not found" });

      const thumbnailUrl = saveThumbnail(files.thumbnail[0].buffer, files.thumbnail[0].originalname);

      const updated = await db
        .update(htmlBlogPosts)
        .set({ thumbnailUrl, updatedAt: new Date() })
        .where(eq(htmlBlogPosts.slug, slug))
        .returning();

      res.json({ message: "Thumbnail updated", post: updated[0] });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

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
