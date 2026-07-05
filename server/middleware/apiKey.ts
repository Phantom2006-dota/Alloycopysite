import { createMiddleware } from 'hono/factory'
import type { AppEnv } from '../types'

export const validateApiKey = createMiddleware<AppEnv>(async (c, next) => {
  const apiKey = c.req.header('X-API-Key')
  const configuredApiKey = process.env.CMS_API_KEY
  const isStandaloneMode = process.env.BACKEND_MODE === 'standalone'

  if (!configuredApiKey) {
    if (isStandaloneMode) {
      return c.json({
        message: 'Service unavailable',
        error: 'CMS_API_KEY is not configured. Backend requires API key in standalone mode.',
      }, 503)
    }
    await next()
    return
  }

  if (!apiKey) {
    return c.json({ message: 'API key required', error: 'Missing x-api-key header' }, 401)
  }

  if (apiKey !== configuredApiKey) {
    return c.json({ message: 'Invalid API key', error: 'The provided API key is not valid' }, 403)
  }

  await next()
})

export function checkApiKeyConfigured(): void {
  const isStandaloneMode = process.env.BACKEND_MODE === 'standalone'
  const configuredApiKey = process.env.CMS_API_KEY
  if (isStandaloneMode && !configuredApiKey) {
    console.error('FATAL: CMS_API_KEY must be set when running in standalone mode.')
    process.exit(1)
  }
}
