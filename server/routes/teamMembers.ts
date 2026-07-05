import { Hono } from 'hono'
import { db } from '../db'
import { teamMembers } from '../../shared/schema'
import { eq, asc } from 'drizzle-orm'
import { authenticateToken, requireRole } from '../middleware/auth'
import type { AppEnv } from '../types'

const app = new Hono<AppEnv>()

app.get('/', async (c) => {
  try {
    const members = await db.select().from(teamMembers)
      .where(eq(teamMembers.isActive, true))
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name))
    return c.json(members)
  } catch (error) {
    console.error('Get team members error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/admin/all', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const members = await db.select().from(teamMembers)
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name))
    return c.json(members)
  } catch (error) {
    console.error('Get admin team members error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/department/:department', async (c) => {
  try {
    const members = await db.select().from(teamMembers)
      .where(eq(teamMembers.department, c.req.param('department')))
      .orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name))
    return c.json(members)
  } catch (error) {
    console.error('Get team members by department error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/:id', async (c) => {
  try {
    const memberId = parseInt(c.req.param('id'))
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId))
    if (!member) return c.json({ message: 'Team member not found' }, 404)
    return c.json(member)
  } catch (error) {
    console.error('Get team member error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const { name, role, department, bio, profilePhoto, socialLinks, sortOrder, isActive } = await c.req.json()
    if (!name || !role) return c.json({ message: 'Name and role are required' }, 400)
    const [newMember] = await db.insert(teamMembers).values({
      name, role, department, bio, profilePhoto,
      socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    }).returning()
    return c.json(newMember, 201)
  } catch (error) {
    console.error('Create team member error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.put('/:id', authenticateToken, requireRole('super_admin', 'editor'), async (c) => {
  try {
    const memberId = parseInt(c.req.param('id'))
    const { name, role, department, bio, profilePhoto, socialLinks, sortOrder, isActive } = await c.req.json()
    const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId))
    if (!existing) return c.json({ message: 'Team member not found' }, 404)
    const updates: Record<string, any> = { updatedAt: new Date() }
    if (name) updates.name = name
    if (role) updates.role = role
    if (department !== undefined) updates.department = department
    if (bio !== undefined) updates.bio = bio
    if (profilePhoto !== undefined) updates.profilePhoto = profilePhoto
    if (socialLinks !== undefined) updates.socialLinks = socialLinks ? JSON.stringify(socialLinks) : null
    if (sortOrder !== undefined) updates.sortOrder = sortOrder
    if (isActive !== undefined) updates.isActive = isActive
    const [updated] = await db.update(teamMembers).set(updates).where(eq(teamMembers.id, memberId)).returning()
    return c.json(updated)
  } catch (error) {
    console.error('Update team member error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.delete('/:id', authenticateToken, requireRole('super_admin'), async (c) => {
  try {
    const memberId = parseInt(c.req.param('id'))
    const [existing] = await db.select().from(teamMembers).where(eq(teamMembers.id, memberId))
    if (!existing) return c.json({ message: 'Team member not found' }, 404)
    await db.delete(teamMembers).where(eq(teamMembers.id, memberId))
    return c.json({ message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Delete team member error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

export default app
