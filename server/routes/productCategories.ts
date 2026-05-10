import { Router, Response } from "express";
import { db } from "../db";
import { productCategories, products } from "../../shared/schema";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET all product categories with published product counts
router.get("/", async (_req, res: Response) => {
  try {
    // FIXED: Use Drizzle's proper SQL template with column references
    const categories = await db.select({
      id: productCategories.id,
      name: productCategories.name,
      slug: productCategories.slug,
      description: productCategories.description,
      image: productCategories.image,
      sortOrder: productCategories.sortOrder,
      isActive: productCategories.isActive,
      createdAt: productCategories.createdAt,
      updatedAt: productCategories.updatedAt,
      productCount: sql<number>`
        (SELECT COUNT(*)::integer 
         FROM products 
         WHERE products.category_id = product_categories.id 
         AND products.status = 'published')
      `.as('productCount')
    })
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

    res.json(categories);
  } catch (error) {
    console.error("Get product categories error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// GET all product categories (admin) - count ALL products regardless of status
router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor"), async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await db.select({
      id: productCategories.id,
      name: productCategories.name,
      slug: productCategories.slug,
      description: productCategories.description,
      image: productCategories.image,
      sortOrder: productCategories.sortOrder,
      isActive: productCategories.isActive,
      createdAt: productCategories.createdAt,
      updatedAt: productCategories.updatedAt,
      productCount: sql<number>`
        (SELECT COUNT(*)::integer 
         FROM products 
         WHERE products.category_id = product_categories.id)
      `.as('productCount')
    })
      .from(productCategories)
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.name));

    res.json(categories);
  } catch (error) {
    console.error("Get admin product categories error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// GET single product category by slug
router.get("/:slug", async (req, res: Response) => {
  try {
    const { slug } = req.params;
    
    const [category] = await db.select().from(productCategories).where(eq(productCategories.slug, slug));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Also return product count for this category
    const [publishedCount] = await db.select({ 
      count: sql<number>`count(*)::integer` 
    }).from(products).where(
      and(
        eq(products.categoryId, category.id),
        eq(products.status, 'published')
      )
    );

    res.json({
      ...category,
      productCount: publishedCount?.count || 0,
    });
  } catch (error) {
    console.error("Get product category error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// POST create new product category
router.post("/", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, image, sortOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    let slug = generateSlug(name);
    const [existing] = await db.select().from(productCategories).where(eq(productCategories.slug, slug));
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const [newCategory] = await db.insert(productCategories).values({
      name,
      slug,
      description,
      image,
      sortOrder: sortOrder || 0,
      isActive: isActive !== false,
    }).returning();

    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Create product category error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// PUT update product category
router.put("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    const [existing] = await db.select().from(productCategories).where(eq(productCategories.id, categoryId));
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const { name, description, image, sortOrder, isActive } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    
    if (name !== undefined) {
      updates.name = name;
      if (name !== existing.name) {
        let slug = generateSlug(name);
        const [slugExists] = await db.select().from(productCategories).where(eq(productCategories.slug, slug));
        if (slugExists && slugExists.id !== categoryId) {
          slug = `${slug}-${Date.now()}`;
        }
        updates.slug = slug;
      }
    }
    if (description !== undefined) updates.description = description;
    if (image !== undefined) updates.image = image;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updatedCategory] = await db.update(productCategories).set(updates).where(eq(productCategories.id, categoryId)).returning();

    res.json(updatedCategory);
  } catch (error) {
    console.error("Update product category error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// DELETE product category
router.delete("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    const [existing] = await db.select().from(productCategories).where(eq(productCategories.id, categoryId));
    if (!existing) {
      return res.status(404).json({ message: "Category not found" });
    }

    const [hasProducts] = await db.select({ count: sql<number>`count(*)::integer` }).from(products).where(eq(products.categoryId, categoryId));
    if (hasProducts.count > 0) {
      return res.status(400).json({ message: "Cannot delete category with products. Move or delete products first." });
    }

    await db.delete(productCategories).where(eq(productCategories.id, categoryId));

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete product category error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Debug endpoint to check category counts and products
router.get("/debug/counts/:slug", async (req, res: Response) => {
  try {
    const { slug } = req.params;
    
    const [category] = await db.select()
      .from(productCategories)
      .where(eq(productCategories.slug, slug));
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found",
        slug 
      });
    }

    // Get all counts
    const [allCount] = await db.select({ 
      count: sql<number>`count(*)::integer` 
    }).from(products).where(eq(products.categoryId, category.id));

    const [publishedCount] = await db.select({ 
      count: sql<number>`count(*)::integer` 
    }).from(products).where(
      and(
        eq(products.categoryId, category.id),
        eq(products.status, 'published')
      )
    );

    const [draftCount] = await db.select({ 
      count: sql<number>`count(*)::integer` 
    }).from(products).where(
      and(
        eq(products.categoryId, category.id),
        eq(products.status, 'draft')
      )
    );

    const [archivedCount] = await db.select({ 
      count: sql<number>`count(*)::integer` 
    }).from(products).where(
      and(
        eq(products.categoryId, category.id),
        eq(products.status, 'archived')
      )
    );

    // Get actual products list with details
    const productList = await db.select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      status: products.status,
      categoryId: products.categoryId,
      price: products.price,
      isInStock: products.isInStock,
      createdAt: products.createdAt,
    })
      .from(products)
      .where(eq(products.categoryId, category.id))
      .orderBy(desc(products.createdAt));

    res.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      },
      counts: {
        total: allCount?.count || 0,
        published: publishedCount?.count || 0,
        draft: draftCount?.count || 0,
        archived: archivedCount?.count || 0,
        publicCount: publishedCount?.count || 0,
      },
      products: productList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug counts error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: (error as Error).message 
    });
  }
});

// Get products for a specific category
router.get("/:slug/products", async (req, res: Response) => {
  try {
    const { slug } = req.params;
    const { page = "1", limit = "12" } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const offset = (pageNum - 1) * limitNum;

    // Get the category
    const [category] = await db.select()
      .from(productCategories)
      .where(eq(productCategories.slug, slug));
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Get total count of PUBLISHED products
    const [{ count }] = await db.select({ 
      count: sql<number>`count(${products.id})::integer` 
    }).from(products).where(
      and(
        eq(products.categoryId, category.id),
        eq(products.status, 'published')
      )
    );

    // Get paginated PUBLISHED products
    const items = await db.select({
      product: products,
      category: productCategories,
    })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(
        and(
          eq(products.categoryId, category.id),
          eq(products.status, 'published')
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(limitNum)
      .offset(offset);

    const formattedItems = items.map(item => ({
      id: item.product.id,
      title: item.product.title,
      slug: item.product.slug,
      description: item.product.description,
      shortDescription: item.product.shortDescription,
      price: item.product.price,
      compareAtPrice: item.product.compareAtPrice,
      featuredImage: item.product.featuredImage,
      images: item.product.images,
      isInStock: item.product.isInStock,
      isFeatured: item.product.isFeatured,
      status: item.product.status,
      stock: item.product.stock,
      sku: item.product.sku,
      category: item.category ? {
        id: item.category.id,
        name: item.category.name,
        slug: item.category.slug,
        description: item.category.description,
        image: item.category.image,
      } : null,
    }));

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
      },
      products: formattedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (error) {
    console.error("Get category products error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

// Bulk update product statuses in a category (admin only)
router.post("/:id/bulk-publish", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categoryId = parseInt(id);

    const [category] = await db.select()
      .from(productCategories)
      .where(eq(productCategories.id, categoryId));
    
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Update all draft products in this category to published
    const result = await db.update(products)
      .set({ 
        status: 'published',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.status, 'draft')
        )
      )
      .returning();

    res.json({
      message: `Updated ${result.length} products from draft to published`,
      updatedCount: result.length,
      category: category.name,
    });
  } catch (error) {
    console.error("Bulk publish error:", error);
    res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
});

export default router;
