import { Hono } from 'hono'
import { db } from '../db'
import { productCategories, products } from '../../shared/schema'
import { eq, desc, asc, sql, and } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

app.get('/admin/all', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const cats = await db.select({
      id: productCategories.id, name: productCategories.name, slug: productCategories.slug,
      description: productCategories.description, image: productCategories.image,
      sortOrder: productCategories.sortOrder, isActive: productCategories.isActive,
      createdAt: productCategories.createdAt, updatedAt: productCategories.updatedAt,
      productCount: sql<number>`(SELECT COUNT(*)::integer FROM products WHERE products.category_id = product_categories.id)`.as('productCount'),
    })
      .from(productCategories)
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.name))
    return c.json(cats)
  } catch (error) {
    console.error('Get admin product categories error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

app.get('/debug/counts/:slug', async (c) => {
  try {
    const [cat] = await db.select().from(productCategories).where(eq(productCategories.slug, c.req.param('slug')))
    if (!cat) return c.json({ message: 'Category not found' }, 404)
    const counts = await db.select({ status: products.status, count: sql<number>`count(*)::integer` })
      .from(products).where(eq(products.categoryId, cat.id)).groupBy(products.status)
    return c.json({ category: cat.name, counts })
  } catch (error) {
    console.error('Debug counts error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:slug/products', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const offset = (page - 1) * limit
    const [cat] = await db.select().from(productCategories).where(eq(productCategories.slug, c.req.param('slug')))
    if (!cat) return c.json({ message: 'Category not found' }, 404)
    const items = await db.select().from(products)
      .where(and(eq(products.categoryId, cat.id), eq(products.status, 'published')))
      .orderBy(desc(products.createdAt)).limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)::integer` }).from(products)
      .where(and(eq(products.categoryId, cat.id), eq(products.status, 'published')))
    return c.json({ products: items, pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) } })
  } catch (error) {
    console.error('Get category products error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:slug', async (c) => {
  try {
    const [category] = await db.select().from(productCategories).where(eq(productCategories.slug, c.req.param('slug')))
    if (!category) return c.json({ message: 'Category not found' }, 404)
    const [{ count }] = await db.select({ count: sql<number>`count(*)::integer` }).from(products)
      .where(and(eq(products.categoryId, category.id), eq(products.status, 'published')))
    return c.json({ ...category, productCount: count || 0 })
  } catch (error) {
    console.error('Get product category error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

app.get('/', async (c) => {
  try {
    const cats = await db.select({
      id: productCategories.id, name: productCategories.name, slug: productCategories.slug,
      description: productCategories.description, image: productCategories.image,
      sortOrder: productCategories.sortOrder, isActive: productCategories.isActive,
      createdAt: productCategories.createdAt, updatedAt: productCategories.updatedAt,
      productCount: sql<number>`(SELECT COUNT(*)::integer FROM products WHERE products.category_id = product_categories.id AND products.status = 'published')`.as('productCount'),
    })
      .from(productCategories)
      .where(eq(productCategories.isActive, true))
      .orderBy(asc(productCategories.sortOrder), asc(productCategories.name))
    return c.json(cats)
  } catch (error) {
    console.error('Get product categories error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const { name, description, image, sortOrder, isActive } = await c.req.json()
    if (!name) return c.json({ message: 'Name is required' }, 400)
    const slug = generateSlug(name)
    const [existing] = await db.select().from(productCategories).where(eq(productCategories.slug, slug))
    if (existing) return c.json({ message: 'Category with this name already exists' }, 400)
    const [newCat] = await db.insert(productCategories).values({
      name, slug, description, image, sortOrder: sortOrder || 0, isActive: isActive !== undefined ? isActive : true,
    }).returning()
    return c.json(newCat, 201)
  } catch (error) {
    console.error('Create product category error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const catId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(productCategories).where(eq(productCategories.id, catId))
    if (!existing) return c.json({ message: 'Category not found' }, 404)
    const { name, description, image, sortOrder, isActive } = await c.req.json()
    const updates: Record<string, any> = { updatedAt: new Date() }
    if (name !== undefined) { updates.name = name; updates.slug = generateSlug(name) }
    if (description !== undefined) updates.description = description
    if (image !== undefined) updates.image = image
    if (sortOrder !== undefined) updates.sortOrder = sortOrder
    if (isActive !== undefined) updates.isActive = isActive
    const [updated] = await db.update(productCategories).set(updates).where(eq(productCategories.id, catId)).returning()
    return c.json(updated)
  } catch (error) {
    console.error('Update product category error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const catId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(productCategories).where(eq(productCategories.id, catId))
    if (!existing) return c.json({ message: 'Category not found' }, 404)
    const [{ count }] = await db.select({ count: sql<number>`count(*)::integer` }).from(products).where(eq(products.categoryId, catId))
    if (count > 0) return c.json({ message: `Cannot delete: category has ${count} product(s)` }, 400)
    await db.delete(productCategories).where(eq(productCategories.id, catId))
    return c.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Delete product category error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

app.post('/:id/bulk-publish', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const catId = parseInt(c.req.param('id'))
    const [category] = await db.select().from(productCategories).where(eq(productCategories.id, catId))
    if (!category) return c.json({ message: 'Category not found' }, 404)
    const result = await db.update(products)
      .set({ status: 'published', updatedAt: new Date() })
      .where(and(eq(products.categoryId, catId), eq(products.status, 'draft')))
      .returning()
    return c.json({ message: `Updated ${result.length} products from draft to published`, updatedCount: result.length, category: category.name })
  } catch (error) {
    console.error('Bulk publish error:', error)
    return c.json({ message: 'Server error', error: (error as Error).message }, 500)
  }
})

export default app
