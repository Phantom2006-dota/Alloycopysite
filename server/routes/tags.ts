import { Hono } from 'hono'
import { db } from '../db'
import { tags } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

app.get('/', async (c) => {
  try {
    const all = await db.select().from(tags).orderBy(tags.name)
    return c.json(all)
  } catch (error) {
    console.error('Get tags error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:slug', async (c) => {
  try {
    const [tag] = await db.select().from(tags).where(eq(tags.slug, c.req.param('slug')))
    if (!tag) return c.json({ message: 'Tag not found' }, 404)
    return c.json(tag)
  } catch (error) {
    console.error('Get tag error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor', 'author'), async (c) => {
  try {
    const { name } = await c.req.json()
    if (!name) return c.json({ message: 'Name is required' }, 400)
    const slug = generateSlug(name)
    const [existing] = await db.select().from(tags).where(eq(tags.slug, slug))
    if (existing) return c.json({ message: 'Tag already exists' }, 400)
    const [newTag] = await db.insert(tags).values({ name, slug }).returning()
    return c.json(newTag, 201)
  } catch (error) {
    console.error('Create tag error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const tagId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(tags).where(eq(tags.id, tagId))
    if (!existing) return c.json({ message: 'Tag not found' }, 404)
    await db.delete(tags).where(eq(tags.id, tagId))
    return c.json({ message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Delete tag error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
