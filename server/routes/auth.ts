import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import { users } from '../../shared/schema'
import { eq } from 'drizzle-orm'
import { generateToken, authenticateToken } from '../middleware/auth'
import type { AppEnv } from '../types'

const ADMIN_USERNAME = 'admin01'
const ADMIN_PASSWORD = 'admin1234'

const app = new Hono<AppEnv>()

app.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) return c.json({ message: 'Username and password are required' }, 400)

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return c.json({ message: 'Invalid credentials' }, 401)
    }

    const [user] = await db.select().from(users).where(eq(users.username, ADMIN_USERNAME))
    if (!user || !user.isActive) return c.json({ message: 'Invalid credentials' }, 401)

    const token = generateToken({ id: user.id, username: user.username, email: user.email, role: user.role })
    return c.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, profileImage: user.profileImage },
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/register', async (c) => {
  try {
    const { username, email, password, name } = await c.req.json()
    if (!username || !email || !password || !name) return c.json({ message: 'All fields are required' }, 400)

    const existingUser = await db.select().from(users).where(eq(users.username, username))
    if (existingUser.length > 0) return c.json({ message: 'Username already exists' }, 400)

    const existingEmail = await db.select().from(users).where(eq(users.email, email))
    if (existingEmail.length > 0) return c.json({ message: 'Email already exists' }, 400)

    const hashedPassword = await bcrypt.hash(password, 10)
    const [newUser] = await db
      .insert(users)
      .values({ username, email, password: hashedPassword, name, role: 'contributor', isActive: true })
      .returning()

    const token = generateToken({ id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role })
    return c.json({ token, user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name, role: newUser.role } }, 201)
  } catch (error) {
    console.error('Register error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.get('/me', authenticateToken, async (c) => {
  try {
    const { id } = c.get('user')
    const [user] = await db.select().from(users).where(eq(users.id, id))
    if (!user) return c.json({ message: 'User not found' }, 404)
    return c.json({
      id: user.id, username: user.username, email: user.email, name: user.name,
      role: user.role, bio: user.bio, profileImage: user.profileImage, socialLinks: user.socialLinks,
    })
  } catch (error) {
    console.error('Me error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.put('/profile', authenticateToken, async (c) => {
  try {
    const { id } = c.get('user')
    const { name, email, bio, profileImage, socialLinks } = await c.req.json()
    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (email !== undefined) updates.email = email
    if (bio !== undefined) updates.bio = bio
    if (profileImage !== undefined) updates.profileImage = profileImage
    if (socialLinks !== undefined) updates.socialLinks = socialLinks

    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning()
    return c.json({
      id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, name: updatedUser.name,
      role: updatedUser.role, bio: updatedUser.bio, profileImage: updatedUser.profileImage, socialLinks: updatedUser.socialLinks,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({ message: 'Server error' }, 500)
  }
})

app.post('/logout', (c) => c.json({ message: 'Logged out successfully' }))

export default app
