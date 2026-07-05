import { Router, Request, Response } from "express";
import { db } from "../db";
import { categories } from "../../shared/schema";
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
    const allCategories = await db.select().from(categories).orderBy(categories.name);
    res.json(allCategories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const slug = generateSlug(name);

    const [existingCategory] = await db.select().from(categories).where(eq(categories.slug, slug));
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      description,
    }).returning();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);
    const { name, description } = req.body;

    const [existingCategory] = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updates: any = {};
    if (name) {
      updates.name = name;
      updates.slug = generateSlug(name);
    }
    if (description !== undefined) updates.description = description;

    const [updatedCategory] = await db.update(categories).set(updates).where(eq(categories.id, categoryId)).returning();

    res.json(updatedCategory);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    const [existingCategory] = await db.select().from(categories).where(eq(categories.id, categoryId));
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    await db.delete(categories).where(eq(categories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
