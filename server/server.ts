import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config()

import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { initMastodon } from './mastodon.js'
import {
  getTopInfluencers,
  getInfluenceGraph,
  serializeToTurtle,
  serializeToJsonLd,
  getStoreStats,
  executeSparqlQuery
} from './rdf-store.js'

const app = express()
const PORT = process.env.PORT || 3000
const ADMIN_SECRET_HASH = process.env.ADMIN_SECRET_HASH || ''

console.log('🔍 PORT from env:', process.env.PORT)
console.log('🔍 PORT being used:', PORT)

const server = createServer(app)

interface Webmention {
  id: number
  source: string
  target: string
  verified: boolean
  approved: boolean
  timestamp: string
  content: string
}

interface BroadcastEvent {
  type: string
  data: unknown
}

const webmentions: Webmention[] = []
let lastMentionId = 0

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const clientDistPath = path.join(__dirname, '../../client/dist')
console.log('🔍 Client dist path:', clientDistPath)

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath))
  console.log('✅ Serving static files from client dist')
} else {
  console.log('ℹ️  Client dist not found - running in dev mode (use Vite for frontend)')
}

const clients = new Set<Response>()

async function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' })
  }

  const token = authHeader.substring(7)

  try {
    const isValid = await bcrypt.compare(token, ADMIN_SECRET_HASH)
    if (!isValid) {
      return res.status(403).json({ error: 'Forbidden: Invalid token' })
    }
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' })
  }
}

app.post('/admin/login', async (req: Request, res: Response) => {
  const { secret } = req.body as { secret?: string }

  console.log('🔐 Login attempt received')

  if (!secret || !ADMIN_SECRET_HASH) {
    return res.status(401).json({ success: false, error: 'Invalid secret' })
  }

  try {
    const isValid = await bcrypt.compare(secret, ADMIN_SECRET_HASH)

    if (isValid) {
      console.log('✅ Login successful')
      res.json({ success: true, message: 'Authenticated' })
    } else {
      console.log('❌ Login failed: invalid password')
      res.status(401).json({ success: false, error: 'Invalid secret' })
    }
  } catch (error) {
    console.error('❌ Login error:', error)
    res.status(500).json({ success: false, error: 'Authentication error' })
  }
})

app.get('/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  res.write('\n')
  clients.add(res)

  req.on('close', () => {
    clients.delete(res)
  })
})

function broadcast(event: BroadcastEvent): void {
  for (const client of clients) {
    client.write(`data: ${JSON.stringify(event)}\n\n`)
  }
}

app.post('/webmention', async (req: Request, res: Response) => {
  const { source, target } = req.body as {
    source?: string
    target?: string
  }

  console.log('📨 Webmention ontvangen:', { source, target })

  if (!source || !target) {
    return res.status(400).json({
      error: 'Missing source or target parameter',
      verified: false,
    })
  }

  const result = await verifyWebmention(source, target)

  if (result.verified) {
    res.status(202).json({
      message: 'Webmention ontvangen en geverifieerd! Na goedkeuring verschijnt deze als ster.',
      status: 'pending_approval',
      verified: true,
    })
  } else {
    res.status(400).json({
      error: result.error || 'Verificatie mislukt',
      verified: false,
    })
  }
})

interface VerifyResult {
  verified: boolean
  error?: string
}

async function verifyWebmention(
    source: string,
    target: string
): Promise<VerifyResult> {
  try {
    const response = await fetch(source)

    if (!response.ok) {
      console.log('❌ Webmention verificatie mislukt: kon bron niet ophalen')
      return { verified: false, error: 'Kon de bron-URL niet ophalen. Controleer of de pagina bereikbaar is.' }
    }

    const html = await response.text()

    if (!html.includes(target)) {
      console.log('❌ Webmention verificatie mislukt: geen link naar target gevonden')
      return { verified: false, error: `De bron-pagina bevat geen link naar ${target}. Voeg eerst een link toe.` }
    }

    const mention: Webmention = {
      id: ++lastMentionId,
      source,
      target,
      verified: true,
      approved: false, // Webmentions require manual approval
      timestamp: new Date().toISOString(),
      content: extractContent(html, target),
    }

    webmentions.push(mention)

    console.log('✅ Webmention geverifieerd (wacht op goedkeuring):', mention)

    broadcast({
      type: 'webmention-pending',
      data: mention,
    })

    return { verified: true }
  } catch (error) {
    console.error('❌ Webmention verificatie error:', error)
    return { verified: false, error: 'Er ging iets mis bij het verifiëren. Probeer het later opnieuw.' }
  }
}

function extractContent(html: string, target: string): string {
  const index = html.indexOf(target)
  if (index === -1) return ''

  const start = Math.max(0, index - 200)
  const end = Math.min(html.length, index + 200)

  return html
      .substring(start, end)
      .replace(/<[^>]*>/g, '')
      .trim()
}

app.post('/test-webmention', (req: Request, res: Response) => {
  const mention: Webmention = {
    id: ++lastMentionId,
    source: 'https://example.com/test',
    target: 'http://localhost:3000/',
    verified: true,
    approved: true, // Test mentions are auto-approved
    timestamp: new Date().toISOString(),
    content: 'Test webmention!',
  }

  webmentions.push(mention)

  broadcast({
    type: 'webmention',
    data: mention,
  })

  res.json({ message: 'Test webmention sent', mention })
})

app.post('/test-webmention-pending', (req: Request, res: Response) => {
  const mention: Webmention = {
    id: ++lastMentionId,
    source: 'https://example.com/test-post-' + Date.now(),
    target: 'http://localhost:3000/',
    verified: true,
    approved: false,
    timestamp: new Date().toISOString(),
    content: 'This is a test pending webmention for admin review.',
  }

  webmentions.push(mention)
  console.log('📨 Test pending webmention created:', mention)

  broadcast({
    type: 'webmention-pending',
    data: mention,
  })

  res.json({ message: 'Test pending webmention created', mention })
})

app.post('/mentions/:id/approve', adminAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10)
  const mention = webmentions.find(m => m.id === id)

  if (!mention) {
    return res.status(404).json({ error: 'Webmention not found' })
  }

  mention.approved = true
  console.log('✅ Webmention goedgekeurd:', mention)

  // Broadcast approved webmention for display
  broadcast({
    type: 'webmention',
    data: mention,
  })

  res.json({ message: 'Webmention approved', mention })
})

// Reject/delete a webmention (protected)
app.post('/mentions/:id/reject', adminAuth, (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10)
  const index = webmentions.findIndex(m => m.id === id)

  if (index === -1) {
    return res.status(404).json({ error: 'Webmention not found' })
  }

  const [removed] = webmentions.splice(index, 1)
  console.log('❌ Webmention afgewezen:', removed)

  res.json({ message: 'Webmention rejected', mention: removed })
})

// Get only approved webmentions (for public display)
app.get('/mentions/approved', (_req: Request, res: Response) => {
  const approved = webmentions.filter(m => m.approved)
  res.json({
    count: approved.length,
    mentions: approved,
  })
})

// Get all webmentions (protected - for admin)
app.get('/mentions', adminAuth, (_req: Request, res: Response) => {
  res.json({
    count: webmentions.length,
    mentions: webmentions,
  })
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
  })
})

// ============================================
// RDF / SPARQL / Linked Data Endpoints
// ============================================

// Get RDF store statistics
app.get('/rdf/stats', (_req: Request, res: Response) => {
  const stats = getStoreStats()
  res.json(stats)
})

// Get top influencers for visualization
app.get('/rdf/influencers', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10
  const influencers = getTopInfluencers(limit)
  res.json(influencers)
})

// Get full influence graph (nodes + edges)
app.get('/rdf/influence-graph', (_req: Request, res: Response) => {
  const graph = getInfluenceGraph()
  res.json(graph)
})

// SPARQL endpoint
app.get('/sparql', async (req: Request, res: Response) => {
  const query = req.query.query as string

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' })
  }

  try {
    const results = await executeSparqlQuery(query)
    res.json({ results })
  } catch (error) {
    console.error('SPARQL query error:', error)
    res.status(400).json({ error: 'Invalid SPARQL query' })
  }
})

// Export RDF as Turtle
app.get('/rdf/turtle', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/turtle')
  res.send(serializeToTurtle())
})

// Export RDF as JSON-LD
app.get('/rdf/jsonld', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/ld+json')
  res.send(serializeToJsonLd())
})

app.use((req: Request, res: Response) => {
  if (
      req.method === 'GET' &&
      !req.path.startsWith('/webmention') &&
      !req.path.startsWith('/mentions') &&
      !req.path.startsWith('/health') &&
      !req.path.startsWith('/events') &&
      !req.path.startsWith('/admin')
  ) {
    const indexPath = path.join(clientDistPath, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(404).json({ error: 'Not found - run Vite dev server for frontend' })
    }
  } else {
    res.status(404).json({ error: 'Not found' })
  }
})

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 SSE endpoint available at /events`)
  initMastodon(broadcast)
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`)
    process.exit(1)
  } else {
    throw error
  }
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
