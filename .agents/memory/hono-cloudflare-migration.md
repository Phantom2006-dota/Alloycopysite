---
name: Hono + Cloudflare Workers migration
description: Key decisions and gotchas for the Express→Hono backend migration targeting Cloudflare Workers.
---

## Summary

The Bauhaus Production CMS backend was migrated from Express (Node.js/Replit) to **Hono** targeting **Cloudflare Workers**, while the React frontend remains on Vercel.

## Architecture decisions

- **Hono** replaces Express — same middleware shape, native Workers support.
- **`@neondatabase/serverless` neon-http driver** replaces `pg` Pool — avoids TCP; works on Workers.
- **`drizzle-orm/neon-http`** for the ORM adapter.
- **Cloudinary base64 upload** (`cloudinary.uploader.upload(dataUri)`) replaces `upload_stream` — no Node.js streams on Workers.
- **`@hono/node-server`** wraps the app for local dev (`tsx server/index.ts`).
- **`nodejs_compat`** flag in `wrangler.toml` covers `jsonwebtoken`, `bcryptjs`, `Buffer`, Cloudinary SDK.
- **Stripe webhook**: `stripe.webhooks.constructEventAsync()` (Web Crypto) replaces pg-Pool-based Replit connector.

## Route conversion pattern

| Express | Hono |
|---------|------|
| `Router()` | `new Hono<AppEnv>()` |
| `(req, res) =>` | `(c) =>` |
| `req.body` | `await c.req.json()` |
| `req.query.x` | `c.req.query('x')` |
| `req.params.x` | `c.req.param('x')` |
| `req.user` | `c.get('user')` |
| `res.json(x)` | `return c.json(x)` |
| `res.status(N).json(x)` | `return c.json(x, N)` |
| multer file | `await c.req.parseBody()` then `file instanceof File` |

## Events schema gotcha

The `events` table status enum is `'upcoming' | 'ongoing' | 'past'` — NOT `'published'`. There are no published events.

## MediaItems schema fields

Correct column names: `castInfo`, `authorInfo`, `externalLinks`, `trailerUrl`, `galleryImages`, `coverImage`. NOT `director`, `author`, `externalLink`.

## Deployment checklist

Secrets to set via `npx wrangler secret put`:
- `DATABASE_URL` (Neon connection string)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ALLOWED_ORIGINS` (Vercel frontend URL, comma-separated)

After deploy: update Stripe webhook endpoint URL to the `*.workers.dev` URL.

**Why:** Workers don't support Node.js TCP sockets, streams, or long-lived connections. The neon-http driver and Cloudinary base64 approach are the only Workers-compatible options.
