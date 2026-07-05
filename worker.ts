/**
 * Cloudflare Workers entry point.
 *
 * Deploy:
 *   npx wrangler secret put DATABASE_URL
 *   npx wrangler secret put STRIPE_SECRET_KEY
 *   npx wrangler secret put STRIPE_WEBHOOK_SECRET
 *   npx wrangler secret put JWT_SECRET
 *   npx wrangler secret put CLOUDINARY_CLOUD_NAME
 *   npx wrangler secret put CLOUDINARY_API_KEY
 *   npx wrangler secret put CLOUDINARY_API_SECRET
 *   npx wrangler secret put ALLOWED_ORIGINS
 *   npm run deploy
 */
import app from './server/app'

export default app
