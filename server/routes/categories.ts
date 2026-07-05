import { Hono } from 'hono'
import { db } from '../db'
import { categories } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

app.get('/', async (c) => {
  try {
    const all = await db.select().from(categories).orderBy(categories.name)
    return c.json(all)
  } catch (error) {
    console.error('Get categories error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:slug', async (c) => {
  try {
    const [category] = await db.select().from(categories).where(eq(categories.slug, c.req.param('slug')))
    if (!category) return c.json({ message: 'Category not found' }, 404)
    return c.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const { name, description } = await c.req.json()
    if (!name) return c.json({ message: 'Name is required' }, 400)
    const slug = generateSlug(name)
    const [existing] = await db.select().from(categories).where(eq(categories.slug, slug))
    if (existing) return c.json({ message: 'Category with this name already exists' }, 400)
    const [newCategory] = await db.insert(categories).values({ name, slug, description }).returning()
    return c.json(newCategory, 201)
  } catch (error) {
    console.error('Create category error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const categoryId = parseInt(c.req.param('id'))
    const { name, description } = await c.req.json()
    const [existing] = await db.select().from(categories).where(eq(categories.id, categoryId))
    if (!existing) return c.json({ message: 'Category not found' }, 404)
    const updates: Record<string, any> = {}
    if (name) { updates.name = name; updates.slug = generateSlug(name) }
    if (description !== undefined) updates.description = description
    const [updated] = await db.update(categories).set(updates).where(eq(categories.id, categoryId)).returning()
    return c.json(updated)
  } catch (error) {
    console.error('Update category error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin'), async (c) => {
  try {
    const categoryId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(categories).where(eq(categories.id, categoryId))
    if (!existing) return c.json({ message: 'Category not found' }, 404)
    await db.delete(categories).where(eq(categories.id, categoryId))
    return c.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Delete category error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
