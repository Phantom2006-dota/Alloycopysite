import { Router, Response } from "express";
import { db } from "../db";
import { products, productCategories } from "../../shared/schema";
import { eq, desc, and, ilike, sql, SQL } from "drizzle-orm";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

router.get("/", async (req, res: Response) => {
  try {
    const { page = "1", limit = "12", category, search, featured, status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [];
    
    if (status) {
      conditions.push(eq(products.status, status as 'draft' | 'published' | 'archived'));
    } else {
      conditions.push(eq(products.status, 'published'));
    }

    if (category) {
      const [cat] = await db.select().from(productCategories).where(eq(productCategories.slug, category as string));
      if (cat) {
        conditions.push(eq(products.categoryId, cat.id));
      }
    }

    if (search) {
      conditions.push(ilike(products.title, `%${search}%`));
    }

    if (featured === "true") {
      conditions.push(eq(products.isFeatured, true));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db.select({
      product: products,
      category: productCategories,
    })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const formattedItems = items.map(item => ({
      ...item.product,
      category: item.category,
    }));

    res.json({
      products: formattedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/featured", async (_req, res: Response) => {
  try {
    const items = await db.select({
      product: products,
      category: productCategories,
    })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.status, 'published'), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(12);

    const formattedItems = items.map(item => ({
      ...item.product,
      category: item.category,
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/category/:slug", async (req, res: Response) => {
  try {
    const { slug } = req.params;
    const { page = "1", limit = "12" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const [category] = await db.select().from(productCategories).where(eq(productCategories.slug, slug));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const items = await db.select({
      product: products,
      category: productCategories,
    })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.status, 'published'), eq(products.categoryId, category.id)))
      .orderBy(desc(products.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.status, 'published'), eq(products.categoryId, category.id)));

    const formattedItems = items.map(item => ({
      ...item.product,
      category: item.category,
    }));

    res.json({
      category,
      products: formattedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get products by category error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/all", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { page = "1", limit = "20", status, search, category } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let conditions: SQL<unknown>[] = [];

    if (status) {
      conditions.push(eq(products.status, status as 'draft' | 'published' | 'archived'));
    }

    if (search) {
      conditions.push(ilike(products.title, `%${search}%`));
    }

    if (category) {
      conditions.push(eq(products.categoryId, parseInt(category as string)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const items = await db.select({
      product: products,
      category: productCategories,
    })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limitNum)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(whereClause);

    const formattedItems = items.map(item => ({
      ...item.product,
      category: item.category,
    }));

    res.json({
      products: formattedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitNum),
      },
    });
  } catch (error) {
    console.error("Get admin products error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:idOrSlug", async (req, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    
    let product;
    const isNumeric = /^\d+$/.test(idOrSlug);
    
    if (isNumeric) {
      const [result] = await db.select({
        product: products,
        category: productCategories,
      })
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
        .where(eq(products.id, parseInt(idOrSlug)));
      product = result;
    } else {
      const [result] = await db.select({
        product: products,
        category: productCategories,
      })
        .from(products)
        .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
        .where(eq(products.slug, idOrSlug));
      product = result;
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      ...product.product,
      category: product.category,
    });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      shortDescription,
      price,
      compareAtPrice,
      sku,
      categoryId,
      images,
      featuredImage,
      stock,
      isInStock,
      isFeatured,
      status,
      metaTitle,
      metaDescription,
      provenance,
      technique,
      historicalContext,
      novelExcerpt,
      makerStory,
    } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    let slug = generateSlug(title);
    const [existing] = await db.select().from(products).where(eq(products.slug, slug));
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const [newProduct] = await db.insert(products).values({
      title,
      slug,
      description,
      shortDescription,
      price: Math.round(price * 100),
      compareAtPrice: compareAtPrice ? Math.round(compareAtPrice * 100) : null,
      sku,
      categoryId: categoryId || null,
      images: images ? JSON.stringify(images) : null,
      featuredImage,
      stock: stock || 0,
      isInStock: isInStock !== false,
      isFeatured: isFeatured || false,
      status: status || 'draft',
      metaTitle,
      metaDescription,
      provenance: provenance || null,
      technique: technique || null,
      historicalContext: historicalContext || null,
      novelExcerpt: novelExcerpt || null,
      makerStory: makerStory || null,
    }).returning();

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const [existing] = await db.select().from(products).where(eq(products.id, productId));
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const {
      title,
      description,
      shortDescription,
      price,
      compareAtPrice,
      sku,
      categoryId,
      images,
      featuredImage,
      stock,
      isInStock,
      isFeatured,
      status,
      metaTitle,
      metaDescription,
      provenance,
      technique,
      historicalContext,
      novelExcerpt,
      makerStory,
    } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    
    if (title !== undefined) {
      updates.title = title;
      if (title !== existing.title) {
        let slug = generateSlug(title);
        const [slugExists] = await db.select().from(products).where(and(eq(products.slug, slug), sql`${products.id} != ${productId}`));
        if (slugExists) {
          slug = `${slug}-${Date.now()}`;
        }
        updates.slug = slug;
      }
    }
    if (description !== undefined) updates.description = description;
    if (shortDescription !== undefined) updates.shortDescription = shortDescription;
    if (price !== undefined) updates.price = Math.round(price * 100);
    if (compareAtPrice !== undefined) updates.compareAtPrice = compareAtPrice ? Math.round(compareAtPrice * 100) : null;
    if (sku !== undefined) updates.sku = sku;
    if (categoryId !== undefined) updates.categoryId = categoryId || null;
    if (images !== undefined) updates.images = images ? JSON.stringify(images) : null;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (stock !== undefined) updates.stock = stock;
    if (isInStock !== undefined) updates.isInStock = isInStock;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;
    if (status !== undefined) updates.status = status;
    if (metaTitle !== undefined) updates.metaTitle = metaTitle;
    if (metaDescription !== undefined) updates.metaDescription = metaDescription;
    if (provenance !== undefined) updates.provenance = provenance || null;
    if (technique !== undefined) updates.technique = technique || null;
    if (historicalContext !== undefined) updates.historicalContext = historicalContext || null;
    if (novelExcerpt !== undefined) updates.novelExcerpt = novelExcerpt || null;
    if (makerStory !== undefined) updates.makerStory = makerStory || null;

    const [updatedProduct] = await db.update(products).set(updates).where(eq(products.id, productId)).returning();

    res.json(updatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authenticateToken, requireRole("super_admin", "editor"), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const [existing] = await db.select().from(products).where(eq(products.id, productId));
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    await db.delete(products).where(eq(products.id, productId));

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
