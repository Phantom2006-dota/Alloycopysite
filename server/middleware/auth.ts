import { createMiddleware } from 'hono/factory'
import jwt from 'jsonwebtoken'
import type { AppEnv } from '../types'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || 'bauhaus-cms-secret-key-change-in-production'
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set. Set this environment variable before deploying to production.')
  }
  return secret
}

export function generateToken(user: { id: number; username: string; email: string; role: string }) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '7d' })
}

export const authenticateToken = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]

  if (!token) return c.json({ message: 'Access token required' }, 401)

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any
    c.set('user', {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    })
    await next()
  } catch {
    return c.json({ message: 'Invalid or expired token' }, 403)
  }
})

export function requireRole(...roles: string[]) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user) return c.json({ message: 'Not authenticated' }, 401)
    if (!roles.includes(user.role)) return c.json({ message: 'Insufficient permissions' }, 403)
    await next()
  })
}
