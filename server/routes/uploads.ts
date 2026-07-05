import { Router, Response } from "express";
import multer from "multer";
import { db } from "../db";
import { uploads } from "../../shared/schema";
import { eq, desc, ilike, and, sql, SQL } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";
import { uploadToCloudinary, uploadImageWithThumbnail, deleteFromCloudinary } from "../lib/cloudinary";

const router = Router();

const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", folder, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [];
    
    if (folder) {
      conditions.push(eq(uploads.folder, folder as string));
    }

    if (search) {
      conditions.push(ilike(uploads.originalName, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const uploadsList = await db
      .select()
      .from(uploads)
      .where(whereClause)
      .orderBy(desc(uploads.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(uploads)
      .where(whereClause);

    res.json({
      uploads: uploadsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        pages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get uploads error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor", "author"), upload.single("file"), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { alt, folder: folderName } = req.body;
    const file = req.file;
    const isImage = file.mimetype.startsWith("image/");

    let cloudinaryResult;
    let thumbnailUrl: string | null = null;
    let publicId: string;

    if (isImage && file.mimetype !== "image/gif") {
      const result = await uploadImageWithThumbnail(file.buffer, {
        folder: folderName ? `bauhaus-cms/${folderName}` : 'bauhaus-cms/images',
      });
      cloudinaryResult = result.original;
      thumbnailUrl = result.thumbnail;
      publicId = result.original.public_id;
    } else {
      cloudinaryResult = await uploadToCloudinary(file.buffer, {
        folder: folderName ? `bauhaus-cms/${folderName}` : 'bauhaus-cms/documents',
        resource_type: isImage ? 'image' : 'raw',
      });
      publicId = cloudinaryResult.public_id;
    }

    const [newUpload] = await db.insert(uploads).values({
      filename: publicId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: cloudinaryResult.secure_url,
      thumbnailPath: thumbnailUrl,
      alt,
      folder: folderName,
      uploadedBy: req.user!.id,
    }).returning();

    res.status(201).json({
      ...newUpload,
      url: cloudinaryResult.secure_url,
      thumbnailUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const uploadId = parseInt(id);

    const [existingUpload] = await db.select().from(uploads).where(eq(uploads.id, uploadId));
    if (!existingUpload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    try {
      const isImage = existingUpload.mimeType.startsWith("image/");
      await deleteFromCloudinary(existingUpload.filename, isImage ? 'image' : 'raw');
    } catch (cloudinaryError) {
      console.error("Cloudinary delete error:", cloudinaryError);
    }

    await db.delete(uploads).where(eq(uploads.id, uploadId));

    res.json({ message: "Upload deleted successfully" });
  } catch (error) {
    console.error("Delete upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", authenticateToken, requireRole("super_admin", "editor", "author"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const uploadId = parseInt(id);
    const { alt, folder } = req.body;

    const [existingUpload] = await db.select().from(uploads).where(eq(uploads.id, uploadId));
    if (!existingUpload) {
      return res.status(404).json({ message: "Upload not found" });
    }

    const updates: Record<string, any> = {};
    if (alt !== undefined) updates.alt = alt;
    if (folder !== undefined) updates.folder = folder;

    const [updatedUpload] = await db.update(uploads).set(updates).where(eq(uploads.id, uploadId)).returning();

    res.json({
      ...updatedUpload,
      url: updatedUpload.path,
      thumbnailUrl: updatedUpload.thumbnailPath,
    });
  } catch (error) {
    console.error("Update upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
