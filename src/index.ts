import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files from web/
app.use('/static/*', serveStatic({ root: './' }))

// API endpoint for runtime ping
app.post('/api/ping', async (c) => {
  return c.json({
    status: 'ok',
    message: 'Runtime pinged. Portal‑OS v1 responding.',
    timestamp: new Date().toISOString(),
  })
})

// Serve the main index page
app.get('/', async (c) => {
  const html = await fetch(new URL('../portal-os-v1/web/index.html', import.meta.url)).then(r => r.text())
  return c.html(html)
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'Portal‑OS v1',
    version: '1.0.0',
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', status: 404 }, 404)
})

export default app
