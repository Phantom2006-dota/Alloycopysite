import { Router, Request, Response } from "express";
import { db } from "../db";
import { tags } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

router.get("/", async (_req: Request, res: Response) => {
  try {
    const allTags = await db.select().from(tags).orderBy(tags.name);
    res.json(allTags);
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [tag] = await db.select().from(tags).where(eq(tags.slug, slug));
    
    if (!tag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.json(tag);
  } catch (error) {
    console.error("Get tag error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor", "author"), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const slug = generateSlug(name);

    const [existingTag] = await db.select().from(tags).where(eq(tags.slug, slug));
    if (existingTag) {
      return res.status(400).json({ message: "Tag already exists" });
    }

    const [newTag] = await db.insert(tags).values({
      name,
      slug,
    }).returning();

    res.status(201).json(newTag);
  } catch (error) {
    console.error("Create tag error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tagId = parseInt(id);

    const [existingTag] = await db.select().from(tags).where(eq(tags.id, tagId));
    if (!existingTag) {
      return res.status(404).json({ message: "Tag not found" });
    }

    await db.delete(tags).where(eq(tags.id, tagId));

    res.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Delete tag error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
