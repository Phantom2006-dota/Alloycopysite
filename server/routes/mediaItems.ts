// [file name]: mediaItems.ts
// [file content begin]
import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db";
import { mediaItems } from "../../shared/schema";
import { eq, desc, and, ilike, sql, SQL } from "drizzle-orm";
import {
  authenticateToken,
  requireRole,
  AuthRequest,
} from "../middleware/auth";
import { uploadToCloudinary } from "../lib/cloudinary";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Debug route to test database connection
router.get("/debug/test-db", async (_req: Request, res: Response) => {
  try {
    // Test simple query
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaItems);
    console.log("Database test successful:", result);

    // Test schema
    const sampleItem = {
      title: "Test Item",
      slug: "test-item-" + Date.now(),
      description: "Test description",
      type: "film",
      coverImage: null,
      releaseDate: new Date(),
      genre: "Action",
      status: "draft",
      isFeatured: false,
    };

    res.json({
      dbConnected: true,
      sampleSchema: sampleItem,
      itemCount: result[0].count,
    });
  } catch (error) {
    console.error("Database test failed:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "12", type, search, featured } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [eq(mediaItems.status, "published")];

    if (type && type !== "all") {
      conditions.push(eq(mediaItems.type, type as any));
    }

    if (featured === "true") {
      conditions.push(eq(mediaItems.isFeatured, true));
    }

    if (search) {
      conditions.push(ilike(mediaItems.title, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const items = await db
      .select()
      .from(mediaItems)
      .where(whereClause)
      .orderBy(desc(mediaItems.releaseDate), desc(mediaItems.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mediaItems)
      .where(whereClause);

    res.json({
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get media items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/type/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { page = "1", limit = "12" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    if (!["book", "film", "tv"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid type. Must be book, film, or tv" });
    }

    const items = await db
      .select()
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.type, type as any),
          eq(mediaItems.status, "published"),
        ),
      )
      .orderBy(desc(mediaItems.releaseDate), desc(mediaItems.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json(items);
  } catch (error) {
    console.error("Get media items by type error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/featured", async (_req: Request, res: Response) => {
  try {
    const items = await db
      .select()
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.isFeatured, true),
          eq(mediaItems.status, "published"),
        ),
      )
      .orderBy(desc(mediaItems.releaseDate))
      .limit(10);

    res.json(items);
  } catch (error) {
    console.error("Get featured media items error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    const [item] = await db
      .select()
      .from(mediaItems)
      .where(eq(mediaItems.id, itemId));

    if (!item) {
      return res.status(404).json({ message: "Media item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Get media item error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(
  "/",
  authenticateToken,
  requireRole("super_admin", "editor"),
  upload.single("coverImage"),
  async (req: AuthRequest, res: Response) => {
    try {
      console.log("=== MEDIA ITEM CREATE REQUEST START ===");
      console.log("Request body fields:", Object.keys(req.body));
      console.log("Request body values:", req.body);
      console.log("Has file:", !!req.file);
      console.log(
        "File details:",
        req.file
          ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
            }
          : "No file",
      );

      const {
        title,
        description,
        type,
        releaseDate,
        genre,
        castInfo,
        authorInfo,
        externalLinks,
        trailerUrl,
        galleryImages,
        isFeatured,
        status,
      } = req.body;

      console.log("Parsed fields:", {
        title,
        type,
        releaseDate,
        genre,
        hasDescription: !!description,
        externalLinksType: typeof externalLinks,
        galleryImagesType: typeof galleryImages,
      });

      if (!title || !type) {
        console.log("Validation failed: Missing title or type");
        return res.status(400).json({ message: "Title and type are required" });
      }

      if (!["book", "film", "tv"].includes(type)) {
        console.log("Validation failed: Invalid type", type);
        return res
          .status(400)
          .json({ message: "Invalid type. Must be book, film, or tv" });
      }

      let coverImageUrl = req.body.coverImage || null;

      // Handle file upload if present
      if (req.file) {
        try {
          console.log("Starting Cloudinary upload...");
          const uploadResult = await uploadToCloudinary(req.file.buffer, {
            folder: `bauhaus-cms/media/${type}`,
            resource_type: "image",
          });
          coverImageUrl = uploadResult.secure_url;
          console.log("Cloudinary upload successful:", coverImageUrl);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res
            .status(500)
            .json({
              message: "Failed to upload image",
              details: uploadError.message,
            });
        }
      }

      const slug = generateSlug(title);
      console.log("Generated slug:", slug);

      // Parse JSON fields safely
      let parsedExternalLinks = null;
      let parsedGalleryImages = null;

      try {
        if (externalLinks && typeof externalLinks === "string") {
          parsedExternalLinks = JSON.parse(externalLinks);
        } else if (externalLinks) {
          parsedExternalLinks = externalLinks;
        }
      } catch (e) {
        console.warn("Failed to parse externalLinks:", e);
        parsedExternalLinks = null;
      }

      try {
        if (galleryImages && typeof galleryImages === "string") {
          parsedGalleryImages = JSON.parse(galleryImages);
        } else if (galleryImages) {
          parsedGalleryImages = galleryImages;
        }
      } catch (e) {
        console.warn("Failed to parse galleryImages:", e);
        parsedGalleryImages = null;
      }

      // Prepare the data for insertion
      const insertData = {
        title,
        slug,
        description: description || null,
        type,
        coverImage: coverImageUrl,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        genre: genre || null,
        castInfo: castInfo || null,
        authorInfo: authorInfo || null,
        externalLinks: parsedExternalLinks
          ? JSON.stringify(parsedExternalLinks)
          : null,
        trailerUrl: trailerUrl || null,
        galleryImages: parsedGalleryImages
          ? JSON.stringify(parsedGalleryImages)
          : null,
        isFeatured: isFeatured === "true" || isFeatured === true || false,
        status: status || "draft",
      };

      console.log("Final insert data:", JSON.stringify(insertData, null, 2));

      const [newItem] = await db
        .insert(mediaItems)
        .values(insertData)
        .returning();

      console.log("✅ Media item created successfully! ID:", newItem.id);
      console.log("=== MEDIA ITEM CREATE REQUEST END ===");

      res.status(201).json(newItem);
    } catch (error) {
      console.error("❌ Create media item error:");
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error object:", error);

      // Check for specific database errors
      if (error.message?.includes("unique constraint")) {
        return res.status(400).json({
          message: "Slug already exists. Please use a different title.",
          error: error.message,
        });
      }

      if (error.message?.includes("violates not-null constraint")) {
        return res.status(400).json({
          message: "Missing required field",
          error: error.message,
        });
      }

      if (error.message?.includes("invalid input syntax")) {
        return res.status(400).json({
          message: "Invalid data format",
          error: error.message,
        });
      }

      res.status(500).json({
        message: "Failed to create media item",
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

router.put(
  "/:id",
  authenticateToken,
  requireRole("super_admin", "editor"),
  upload.single("coverImage"),
  async (req: AuthRequest, res: Response) => {
    try {
      console.log("=== MEDIA ITEM UPDATE REQUEST START ===");
      const { id } = req.params;
      const itemId = parseInt(id);
      const {
        title,
        description,
        type,
        releaseDate,
        genre,
        castInfo,
        authorInfo,
        externalLinks,
        trailerUrl,
        galleryImages,
        isFeatured,
        status,
      } = req.body;

      console.log("Updating media item ID:", itemId);
      console.log("Request body:", req.body);
      console.log("Has file:", !!req.file);

      const [existingItem] = await db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.id, itemId));
      if (!existingItem) {
        console.log("Media item not found:", itemId);
        return res.status(404).json({ message: "Media item not found" });
      }

      let coverImageUrl =
        req.body.coverImage !== undefined
          ? req.body.coverImage
          : existingItem.coverImage;

      // Handle file upload if present
      if (req.file) {
        try {
          console.log("Uploading new cover image...");
          const uploadResult = await uploadToCloudinary(req.file.buffer, {
            folder: `bauhaus-cms/media/${type || existingItem.type}`,
            resource_type: "image",
          });
          coverImageUrl = uploadResult.secure_url;
          console.log("New cover image uploaded:", coverImageUrl);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res
            .status(500)
            .json({
              message: "Failed to upload image",
              details: uploadError.message,
            });
        }
      }

      const updates: any = {
        updatedAt: new Date(),
      };

      if (title) {
        updates.title = title;
        updates.slug = generateSlug(title);
      }
      if (description !== undefined) updates.description = description;
      if (type && ["book", "film", "tv"].includes(type)) updates.type = type;
      if (coverImageUrl !== undefined) updates.coverImage = coverImageUrl;
      if (releaseDate !== undefined)
        updates.releaseDate = releaseDate ? new Date(releaseDate) : null;
      if (genre !== undefined) updates.genre = genre;
      if (castInfo !== undefined) updates.castInfo = castInfo;
      if (authorInfo !== undefined) updates.authorInfo = authorInfo;
      if (externalLinks !== undefined)
        updates.externalLinks = externalLinks
          ? JSON.stringify(externalLinks)
          : null;
      if (trailerUrl !== undefined) updates.trailerUrl = trailerUrl;
      if (galleryImages !== undefined)
        updates.galleryImages = galleryImages
          ? JSON.stringify(galleryImages)
          : null;
      if (isFeatured !== undefined)
        updates.isFeatured = isFeatured === "true" || isFeatured === true;
      if (status) updates.status = status;

      console.log("Applying updates:", updates);

      const [updatedItem] = await db
        .update(mediaItems)
        .set(updates)
        .where(eq(mediaItems.id, itemId))
        .returning();

      console.log("✅ Media item updated successfully!");
      console.log("=== MEDIA ITEM UPDATE REQUEST END ===");

      res.json(updatedItem);
    } catch (error) {
      console.error("❌ Update media item error:", error);
      console.error("Full error:", error);
      res.status(500).json({
        message: "Server error",
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  requireRole("super_admin", "editor"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);

      const [existingItem] = await db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.id, itemId));
      if (!existingItem) {
        return res.status(404).json({ message: "Media item not found" });
      }

      await db.delete(mediaItems).where(eq(mediaItems.id, itemId));

      res.json({ message: "Media item deleted successfully" });
    } catch (error) {
      console.error("Delete media item error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

router.get(
  "/admin/all",
  authenticateToken,
  requireRole("super_admin", "editor"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = "1", limit = "12", type, status, search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let conditions: SQL<unknown>[] = [];

      if (type && type !== "all") {
        conditions.push(eq(mediaItems.type, type as any));
      }

      if (status && status !== "all") {
        conditions.push(eq(mediaItems.status, status as any));
      }

      if (search) {
        conditions.push(ilike(mediaItems.title, `%${search}%`));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select()
        .from(mediaItems)
        .where(whereClause)
        .orderBy(desc(mediaItems.createdAt))
        .limit(limitNum)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(mediaItems)
        .where(whereClause);

      res.json({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: Number(count),
          pages: Math.ceil(Number(count) / limitNum),
        },
      });
    } catch (error) {
      console.error("Get admin media items error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
// [file content end]
