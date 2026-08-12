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
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal‑OS v1</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          border-radius: 10px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          padding: 40px;
          max-width: 600px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin: 0 0 10px 0;
        }
        .version {
          color: #666;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .status {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 10px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .endpoint {
          background: #f3f4f6;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 10px 0;
          text-align: left;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 12px;
        }
        .endpoint-method {
          color: #667eea;
          font-weight: 600;
        }
        .endpoint-path {
          color: #333;
        }
        .endpoints-section {
          text-align: left;
          margin-top: 30px;
          border-top: 2px solid #eee;
          padding-top: 20px;
        }
        .endpoints-section h3 {
          color: #333;
          margin: 0 0 15px 0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 Portal‑OS v1</h1>
        <p class="version">Multi-domain operating substrate on Cloudflare Workers</p>
        <div class="status">✓ Online & Responding</div>
        
        <div class="endpoints-section">
          <h3>Available Endpoints</h3>
          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/</span> - This page
          </div>
          <div class="endpoint">
            <span class="endpoint-method">GET</span>
            <span class="endpoint-path">/health</span> - Service health check
          </div>
          <div class="endpoint">
            <span class="endpoint-method">POST</span>
            <span class="endpoint-path">/api/ping</span> - Runtime ping
          </div>
        </div>
      </div>
    </body>
    </html>
  `
  return c.html(html)
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'Portal‑OS v1',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', status: 404 }, 404)
})

export default app
