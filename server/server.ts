import express, { type Request, type Response } from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { initMastodon } from './mastodon.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

console.log('🔍 PORT from env:', process.env.PORT)
console.log('🔍 PORT being used:', PORT)

const server = createServer(app)

interface Webmention {
  id: number
  source: string
  target: string
  verified: boolean
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
app.use(express.static(clientDistPath))

const clients = new Set<Response>()

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

app.post('/webmention', (req: Request, res: Response) => {
  const { source, target } = req.body as {
    source?: string
    target?: string
  }

  console.log('📨 Webmention ontvangen:', { source, target })

  if (!source || !target) {
    return res.status(400).json({
      error: 'Missing source or target parameter',
    })
  }

  res.status(202).json({
    message: 'Webmention accepted',
    status: 'pending',
  })

  verifyWebmention(source, target)
})

async function verifyWebmention(
    source: string,
    target: string
): Promise<void> {
  try {
    const response = await fetch(source)
    const html = await response.text()

    if (!html.includes(target)) return

    const mention: Webmention = {
      id: ++lastMentionId,
      source,
      target,
      verified: true,
      timestamp: new Date().toISOString(),
      content: extractContent(html, target),
    }

    webmentions.push(mention)

    console.log('✅ Webmention geverifieerd:', mention)

    broadcast({
      type: 'webmention',
      data: mention,
    })
  } catch (error) {
    console.error('❌ Webmention verificatie error:', error)
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

app.get('/mentions', (_req: Request, res: Response) => {
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

app.use((req: Request, res: Response) => {
  if (
      req.method === 'GET' &&
      !req.path.startsWith('/webmention') &&
      !req.path.startsWith('/mentions') &&
      !req.path.startsWith('/health') &&
      !req.path.startsWith('/events')
  ) {
    res.sendFile(path.join(clientDistPath, 'index.html'))
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
