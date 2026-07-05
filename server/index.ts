import { serve } from '@hono/node-server'
import app from './app'
import { runStartupMigrations } from './db'

const PORT = parseInt(process.env.PORT || '5000', 10)

async function main() {
  await runStartupMigrations()

  serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
    console.log('\n' + '='.repeat(60))
    console.log('🚀 Bauhaus CMS API — Hono / Node.js')
    console.log(`   http://localhost:${info.port}`)
    console.log('='.repeat(60))
    console.log('\n📚 API Routes:')
    console.log('   /api/auth/*')
    console.log('   /api/articles/*')
    console.log('   /api/categories/*')
    console.log('   /api/tags/*')
    console.log('   /api/media/*')
    console.log('   /api/team/*')
    console.log('   /api/events/*')
    console.log('   /api/uploads/*')
    console.log('   /api/products/*')
    console.log('   /api/product-categories/*')
    console.log('   /api/payments/*')
    console.log('   /api/html-blog/*')
    console.log('   /api/stripe/webhook')
    console.log('   /api/health\n')
  })
}

main().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
