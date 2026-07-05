import { Hono } from 'hono'
import { db } from '../db'
import { products, productCategories } from '../../shared/schema'
import { eq, desc, and, ilike, sql, SQL, or } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

app.get('/featured', async (c) => {
  try {
    const items = await db.select({ product: products, category: productCategories })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.status, 'published'), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(12)
    return c.json(items.map(i => ({ ...i.product, category: i.category })))
  } catch (error) {
    console.error('Get featured products error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/admin/all', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const category = c.req.query('category')
    const search = c.req.query('search')
    const status = c.req.query('status')
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (status) conditions.push(eq(products.status, status as any))
    if (category) {
      const [cat] = await db.select().from(productCategories).where(eq(productCategories.slug, category))
      if (cat) conditions.push(eq(products.categoryId, cat.id))
    }
    if (search) conditions.push(ilike(products.title, `%${search}%`))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.select({ product: products, category: productCategories })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause)
    return c.json({ products: items.map(i => ({ ...i.product, category: i.category })), pagination: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get admin products error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/category/:slug', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const offset = (page - 1) * limit
    const [category] = await db.select().from(productCategories).where(eq(productCategories.slug, c.req.param('slug')))
    if (!category) return c.json({ message: 'Category not found' }, 404)

    const items = await db.select({ product: products, category: productCategories })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.status, 'published'), eq(products.categoryId, category.id)))
      .orderBy(desc(products.createdAt))
      .limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(products)
      .where(and(eq(products.status, 'published'), eq(products.categoryId, category.id)))
    return c.json({ category, products: items.map(i => ({ ...i.product, category: i.category })), pagination: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get products by category error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const category = c.req.query('category')
    const search = c.req.query('search')
    const featured = c.req.query('featured')
    const status = c.req.query('status')
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (status) {
      conditions.push(eq(products.status, status as any))
    } else {
      conditions.push(eq(products.status, 'published'))
    }
    if (category) {
      const [cat] = await db.select().from(productCategories).where(eq(productCategories.slug, category))
      if (cat) conditions.push(eq(products.categoryId, cat.id))
    }
    if (search) conditions.push(ilike(products.title, `%${search}%`))
    if (featured === 'true') conditions.push(eq(products.isFeatured, true))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.select({ product: products, category: productCategories })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause)
    return c.json({ products: items.map(i => ({ ...i.product, category: i.category })), pagination: { page, limit, total: Number(count), totalPages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get products error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:idOrSlug', async (c) => {
  try {
    const idOrSlug = c.req.param('idOrSlug')
    const isId = /^\d+$/.test(idOrSlug)
    const [item] = isId
      ? await db.select({ product: products, category: productCategories })
          .from(products).leftJoin(productCategories, eq(products.categoryId, productCategories.id))
          .where(eq(products.id, parseInt(idOrSlug)))
      : await db.select({ product: products, category: productCategories })
          .from(products).leftJoin(productCategories, eq(products.categoryId, productCategories.id))
          .where(eq(products.slug, idOrSlug))
    if (!item) return c.json({ message: 'Product not found' }, 404)
    return c.json({ ...item.product, category: item.category })
  } catch (error) {
    console.error('Get product error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, shortDescription, price, compareAtPrice, sku, categoryId,
      images, featuredImage, stock, isInStock, isFeatured, status, metaTitle, metaDescription,
      provenance, technique, historicalContext, novelExcerpt, makerStory } = body

    if (!title || price === undefined) return c.json({ message: 'Title and price are required' }, 400)

    const slug = generateSlug(title)
    const [newProduct] = await db.insert(products).values({
      title, slug, description, shortDescription,
      price: Math.round(price * 100),
      compareAtPrice: compareAtPrice ? Math.round(compareAtPrice * 100) : null,
      sku, categoryId: categoryId || null,
      images: images ? JSON.stringify(images) : null,
      featuredImage, stock, isInStock: isInStock !== undefined ? isInStock : true,
      isFeatured: isFeatured || false,
      status: status || 'draft',
      metaTitle, metaDescription, provenance, technique, historicalContext, novelExcerpt, makerStory,
    }).returning()
    return c.json(newProduct, 201)
  } catch (error) {
    console.error('Create product error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const productId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(products).where(eq(products.id, productId))
    if (!existing) return c.json({ message: 'Product not found' }, 404)

    const body = await c.req.json()
    const updates: Record<string, any> = { updatedAt: new Date() }
    const fields = ['title', 'description', 'shortDescription', 'sku', 'categoryId', 'featuredImage',
      'stock', 'isInStock', 'isFeatured', 'status', 'metaTitle', 'metaDescription',
      'provenance', 'technique', 'historicalContext', 'novelExcerpt', 'makerStory']
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f] !== null && f === 'categoryId' ? (body[f] || null) : body[f]
    }
    if (body.title !== undefined) updates.slug = generateSlug(body.title)
    if (body.price !== undefined) updates.price = Math.round(body.price * 100)
    if (body.compareAtPrice !== undefined) updates.compareAtPrice = body.compareAtPrice ? Math.round(body.compareAtPrice * 100) : null
    if (body.images !== undefined) updates.images = body.images ? JSON.stringify(body.images) : null

    const [updated] = await db.update(products).set(updates).where(eq(products.id, productId)).returning()
    return c.json(updated)
  } catch (error) {
    console.error('Update product error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const productId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(products).where(eq(products.id, productId))
    if (!existing) return c.json({ message: 'Product not found' }, 404)
    await db.delete(products).where(eq(products.id, productId))
    return c.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
