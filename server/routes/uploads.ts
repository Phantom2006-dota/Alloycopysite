import { Hono } from 'hono'
import { db } from '../db'
import { uploads } from '../../shared/schema'
import { eq, desc, ilike, and, sql } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import { uploadToCloudinary, uploadImageWithThumbnail, deleteFromCloudinary } from '../lib/cloudinary'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

app.get('/', authenticateToken, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '20')
    const folder = c.req.query('folder')
    const search = c.req.query('search')
    const offset = (page - 1) * limit

    const conditions: any[] = []
    if (folder) conditions.push(eq(uploads.folder, folder))
    if (search) conditions.push(ilike(uploads.originalName, `%${search}%`))
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const uploadsList = await db.select().from(uploads).where(whereClause).orderBy(desc(uploads.createdAt)).limit(limit).offset(offset)
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(uploads).where(whereClause)

    return c.json({
      uploads: uploadsList,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
    })
  } catch (error) {
    console.error('Get uploads error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor', 'author'), async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']
    if (!file || !(file instanceof File)) return c.json({ message: 'No file uploaded' }, 400)
    if (!ALLOWED_TYPES.includes(file.type)) return c.json({ message: 'Invalid file type' }, 400)
    if (file.size > 10 * 1024 * 1024) return c.json({ message: 'File too large (max 10MB)' }, 400)

    const alt = body['alt'] as string | undefined
    const folderName = body['folder'] as string | undefined
    const isImage = file.type.startsWith('image/')
    const buffer = Buffer.from(await file.arrayBuffer())

    let cloudinaryResult, thumbnailUrl: string | null = null, publicId: string

    if (isImage && file.type !== 'image/gif') {
      const result = await uploadImageWithThumbnail(buffer, {
        folder: folderName ? `bauhaus-cms/${folderName}` : 'bauhaus-cms/images',
        mimeType: file.type,
      })
      cloudinaryResult = result.original
      thumbnailUrl = result.thumbnail
      publicId = result.original.public_id
    } else {
      cloudinaryResult = await uploadToCloudinary(buffer, {
        folder: folderName ? `bauhaus-cms/${folderName}` : 'bauhaus-cms/documents',
        resource_type: isImage ? 'image' : 'raw',
        mimeType: file.type,
      })
      publicId = cloudinaryResult.public_id
    }

    const user = c.get('user')
    const [newUpload] = await db.insert(uploads).values({
      filename: publicId,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: cloudinaryResult.secure_url,
      thumbnailPath: thumbnailUrl,
      alt,
      folder: folderName,
      uploadedBy: user.id,
    }).returning()

    return c.json({ ...newUpload, url: cloudinaryResult.secure_url, thumbnailUrl }, 201)
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor', 'author'), async (c) => {
  try {
    const uploadId = parseInt(c.req.param('id'))
    const { alt, folder } = await c.req.json()
    const [existing] = await db.select().from(uploads).where(eq(uploads.id, uploadId))
    if (!existing) return c.json({ message: 'Upload not found' }, 404)
    const updates: Record<string, any> = {}
    if (alt !== undefined) updates.alt = alt
    if (folder !== undefined) updates.folder = folder
    const [updated] = await db.update(uploads).set(updates).where(eq(uploads.id, uploadId)).returning()
    return c.json({ ...updated, url: updated.path, thumbnailUrl: updated.thumbnailPath })
  } catch (error) {
    console.error('Update upload error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const uploadId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(uploads).where(eq(uploads.id, uploadId))
    if (!existing) return c.json({ message: 'Upload not found' }, 404)
    try {
      const isImage = existing.mimeType.startsWith('image/')
      await deleteFromCloudinary(existing.filename, isImage ? 'image' : 'raw')
    } catch (cloudinaryError) {
      console.error('Cloudinary delete error:', cloudinaryError)
    }
    await db.delete(uploads).where(eq(uploads.id, uploadId))
    return c.json({ message: 'Upload deleted successfully' })
  } catch (error) {
    console.error('Delete upload error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
