import { Hono } from 'hono'
import { db } from '../db'
import { mediaItems } from '../../shared/schema'
import { eq, desc, and, ilike, sql, SQL } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import { uploadToCloudinary } from '../lib/cloudinary'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

app.get('/debug/test-db', async (c) => {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(mediaItems)
    return c.json({ dbConnected: true, itemCount: result[0].count })
  } catch (error: any) {
    return c.json({ error: error.message }, 500)
  }
})

app.get('/admin/all', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const type = c.req.query('type')
    const status = c.req.query('status')
    const search = c.req.query('search')
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (type && type !== 'all') conditions.push(eq(mediaItems.type, type as any))
    if (status && status !== 'all') conditions.push(eq(mediaItems.status, status as any))
    if (search) conditions.push(ilike(mediaItems.title, `%${search}%`))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.select().from(mediaItems).where(whereClause).orderBy(desc(mediaItems.createdAt)).limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mediaItems).where(whereClause)
    return c.json({ items, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get admin media items error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/featured', async (c) => {
  try {
    const items = await db.select().from(mediaItems)
      .where(and(eq(mediaItems.status, 'published'), eq(mediaItems.isFeatured, true)))
      .orderBy(desc(mediaItems.releaseDate), desc(mediaItems.createdAt))
      .limit(12)
    return c.json(items)
  } catch (error) {
    console.error('Get featured media items error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/type/:type', async (c) => {
  try {
    const type = c.req.param('type')
    if (!['book', 'film', 'tv'].includes(type)) return c.json({ message: 'Invalid type. Must be book, film, or tv' }, 400)
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const offset = (page - 1) * limit
    const items = await db.select().from(mediaItems)
      .where(and(eq(mediaItems.type, type as any), eq(mediaItems.status, 'published')))
      .orderBy(desc(mediaItems.releaseDate), desc(mediaItems.createdAt))
      .limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mediaItems)
      .where(and(eq(mediaItems.type, type as any), eq(mediaItems.status, 'published')))
    return c.json({ items, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get media items by type error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '12')
    const type = c.req.query('type')
    const search = c.req.query('search')
    const featured = c.req.query('featured')
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = [eq(mediaItems.status, 'published')]
    if (type && type !== 'all') conditions.push(eq(mediaItems.type, type as any))
    if (featured === 'true') conditions.push(eq(mediaItems.isFeatured, true))
    if (search) conditions.push(ilike(mediaItems.title, `%${search}%`))
    const whereClause = and(...conditions)

    const items = await db.select().from(mediaItems).where(whereClause).orderBy(desc(mediaItems.releaseDate), desc(mediaItems.createdAt)).limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(mediaItems).where(whereClause)
    return c.json({ items, pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) } })
  } catch (error) {
    console.error('Get media items error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [item] = await db.select().from(mediaItems).where(eq(mediaItems.id, id))
    if (!item) return c.json({ message: 'Media item not found' }, 404)
    return c.json(item)
  } catch (error) {
    console.error('Get media item error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

/**
 * Parse a multipart form body into a partial mediaItems row.
 * Field names match the schema exactly: castInfo, authorInfo, externalLinks, trailerUrl, galleryImages.
 */
async function parseMediaBody(c: any, isUpdate = false): Promise<Record<string, any>> {
  const body = await c.req.parseBody()
  const file = body['coverImage']

  const title = body['title'] as string | undefined
  const type = body['type'] as string | undefined
  const description = body['description'] as string | undefined
  const genre = body['genre'] as string | undefined
  const releaseDate = body['releaseDate'] as string | undefined
  const castInfo = body['castInfo'] as string | undefined
  const authorInfo = body['authorInfo'] as string | undefined
  const externalLinks = body['externalLinks'] as string | undefined
  const trailerUrl = body['trailerUrl'] as string | undefined
  const galleryImages = body['galleryImages'] as string | undefined
  const isFeatured = body['isFeatured'] === 'true'
  const status = (body['status'] as string) || 'draft'

  if (!isUpdate && (!title || !type)) throw new Error('Title and type are required')
  if (type && !['book', 'film', 'tv'].includes(type)) throw new Error('Invalid type')

  let coverImageUrl: string | null = null
  if (file instanceof File) {
    if (!IMAGE_TYPES.includes(file.type)) throw new Error('Invalid image type')
    if (file.size > 10 * 1024 * 1024) throw new Error('Image too large (max 10MB)')
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, { folder: 'bauhaus-cms/media', mimeType: file.type })
    coverImageUrl = result.secure_url
  }

  const values: Record<string, any> = {}
  if (title !== undefined) values.title = title
  if (title && !isUpdate) values.slug = generateSlug(title)
  if (type !== undefined) values.type = type
  if (description !== undefined) values.description = description
  if (genre !== undefined) values.genre = genre
  if (releaseDate) values.releaseDate = new Date(releaseDate)
  if (castInfo !== undefined) values.castInfo = castInfo
  if (authorInfo !== undefined) values.authorInfo = authorInfo
  if (externalLinks !== undefined) values.externalLinks = externalLinks
  if (trailerUrl !== undefined) values.trailerUrl = trailerUrl
  if (galleryImages !== undefined) values.galleryImages = galleryImages
  if (body['isFeatured'] !== undefined) values.isFeatured = isFeatured
  if (body['status'] !== undefined) values.status = status
  if (coverImageUrl) values.coverImage = coverImageUrl

  return values
}

app.post('/', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const values = await parseMediaBody(c)
    const [item] = await db.insert(mediaItems).values(values as any).returning()
    return c.json(item, 201)
  } catch (error: any) {
    console.error('Create media item error:', error)
    return c.json({ message: error.message || 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(mediaItems).where(eq(mediaItems.id, id))
    if (!existing) return c.json({ message: 'Media item not found' }, 404)

    const contentType = c.req.header('Content-Type') || ''
    let updates: Record<string, any>
    if (contentType.includes('multipart/form-data')) {
      updates = await parseMediaBody(c, true)
    } else {
      const body = await c.req.json()
      // Only allow known schema fields
      const allowed = ['title','description','type','genre','releaseDate','castInfo','authorInfo',
        'externalLinks','trailerUrl','galleryImages','coverImage','isFeatured','status']
      updates = {}
      for (const k of allowed) {
        if (body[k] !== undefined) updates[k] = body[k]
      }
      if (updates.title) updates.slug = generateSlug(updates.title)
      if (updates.releaseDate) updates.releaseDate = new Date(updates.releaseDate)
    }

    updates.updatedAt = new Date()
    const [updated] = await db.update(mediaItems).set(updates).where(eq(mediaItems.id, id)).returning()
    return c.json(updated)
  } catch (error: any) {
    console.error('Update media item error:', error)
    return c.json({ message: error.message || 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(mediaItems).where(eq(mediaItems.id, id))
    if (!existing) return c.json({ message: 'Media item not found' }, 404)
    await db.delete(mediaItems).where(eq(mediaItems.id, id))
    return c.json({ message: 'Media item deleted successfully' })
  } catch (error) {
    console.error('Delete media item error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
