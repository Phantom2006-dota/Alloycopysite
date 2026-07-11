import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db";
import { pressItems } from "../../shared/schema";
import { eq, desc, and, sql, SQL } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import { uploadToCloudinary } from "../lib/cloudinary";

const router = Router();

const storage = multer.memoryStorage();

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const PDF_TYPE = "application/pdf";

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.fieldname === "newspaperImage") {
    if (IMAGE_TYPES.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Newspaper image must be an image file (jpeg, png, gif, or webp)."));
  }
  if (file.fieldname === "pdf") {
    if (file.mimetype === PDF_TYPE) {
      return cb(null, true);
    }
    return cb(new Error("Press document must be a PDF file."));
  }
  return cb(new Error("Unexpected file field."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// GET /api/press — public, published items only
router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", featured } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [eq(pressItems.status, "published")];

    if (featured === "true") {
      conditions.push(eq(pressItems.isFeatured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db
      .select()
      .from(pressItems)
      .where(whereClause)
      .orderBy(desc(pressItems.publishedDate), desc(pressItems.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pressItems)
      .where(whereClause);

    res.json({
      pressItems: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error: any) {
    console.error("Get press items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/press/admin/all — admin only, all statuses
router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor"), async (_req: AuthRequest, res: Response) => {
  try {
    const items = await db.select().from(pressItems).orderBy(desc(pressItems.createdAt));
    res.json(items);
  } catch (error) {
    console.error("Get admin press items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/press/:slug — public, published only
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [item] = await db
      .select()
      .from(pressItems)
      .where(and(eq(pressItems.slug, slug), eq(pressItems.status, "published")));
    if (!item) {
      return res.status(404).json({ message: "Press item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Get press item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/press — admin only, create with optional image + pdf upload
router.post(
  "/",
  authenticateToken,
  requireRole("super_admin", "editor"),
  upload.fields([
    { name: "newspaperImage", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, content, source, publishedDate, externalLink, isFeatured, status } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

      let newspaperImageUrl = req.body.newspaperImage || null;
      if (files?.newspaperImage?.[0]) {
        const uploadResult = await uploadToCloudinary(files.newspaperImage[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "image",
        });
        newspaperImageUrl = uploadResult.secure_url;
      }

      let pdfUrl = req.body.pdfUrl || null;
      if (files?.pdf?.[0]) {
        const uploadResult = await uploadToCloudinary(files.pdf[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "raw",
        });
        pdfUrl = uploadResult.secure_url;
      }

      const slug = generateSlug(title);

      const [newItem] = await db
        .insert(pressItems)
        .values({
          title,
          slug,
          description: description || null,
          content: content || null,
          source: source || null,
          publishedDate: publishedDate ? new Date(publishedDate) : null,
          newspaperImage: newspaperImageUrl,
          pdfUrl,
          externalLink: externalLink || null,
          isFeatured: isFeatured === "true" || isFeatured === true,
          status: status || "published",
        })
        .returning();

      res.status(201).json(newItem);
    } catch (error: any) {
      console.error("Create press item error:", error);
      if (error.message?.includes("unique constraint")) {
        return res.status(400).json({ message: "Slug already exists. Please use a different title." });
      }
      res.status(500).json({ message: "Failed to create press item", error: error.message });
    }
  }
);

// PUT /api/press/:id — admin only, update with optional file replacement
router.put(
  "/:id",
  authenticateToken,
  requireRole("super_admin", "editor"),
  upload.fields([
    { name: "newspaperImage", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);
      const { title, description, content, source, publishedDate, externalLink, isFeatured, status } = req.body;

      const [existingItem] = await db.select().from(pressItems).where(eq(pressItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Press item not found" });
      }

      const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

      let newspaperImageUrl = req.body.newspaperImage !== undefined ? req.body.newspaperImage : existingItem.newspaperImage;
      if (files?.newspaperImage?.[0]) {
        const uploadResult = await uploadToCloudinary(files.newspaperImage[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "image",
        });
        newspaperImageUrl = uploadResult.secure_url;
      }

      let pdfUrl = req.body.pdfUrl !== undefined ? req.body.pdfUrl : existingItem.pdfUrl;
      if (files?.pdf?.[0]) {
        const uploadResult = await uploadToCloudinary(files.pdf[0].buffer, {
          folder: "bauhaus-cms/press",
          resource_type: "raw",
        });
        pdfUrl = uploadResult.secure_url;
      }

      const updates: any = { updatedAt: new Date() };
      if (title) {
        updates.title = title;
        updates.slug = generateSlug(title);
      }
      if (description !== undefined) updates.description = description;
      if (content !== undefined) updates.content = content;
      if (source !== undefined) updates.source = source;
      if (publishedDate !== undefined) updates.publishedDate = publishedDate ? new Date(publishedDate) : null;
      if (newspaperImageUrl !== undefined) updates.newspaperImage = newspaperImageUrl;
      if (pdfUrl !== undefined) updates.pdfUrl = pdfUrl;
      if (externalLink !== undefined) updates.externalLink = externalLink;
      if (isFeatured !== undefined) updates.isFeatured = isFeatured === "true" || isFeatured === true;
      if (status) updates.status = status;

      const [updatedItem] = await db.update(pressItems).set(updates).where(eq(pressItems.id, itemId)).returning();

      res.json(updatedItem);
    } catch (error: any) {
      console.error("Update press item error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// DELETE /api/press/:id — super_admin only
router.delete("/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    const [existingItem] = await db.select().from(pressItems).where(eq(pressItems.id, itemId));
    if (!existingItem) {
      return res.status(404).json({ message: "Press item not found" });
    }

    await db.delete(pressItems).where(eq(pressItems.id, itemId));

    res.json({ message: "Press item deleted successfully" });
  } catch (error) {
    console.error("Delete press item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
