import express from 'express'
import fetch from 'node-fetch'
import crypto from 'node:crypto'

const router = express.Router()

// Simple in-memory cache for proxied resources
const cache = new Map()
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours
const MAX_ENTRIES = 5000
const QUERY_URL = process.env.RERUM_QUERY_URL || 'http://tinypaul.rerum.io/dla/query'

function makeCacheKey(id) {
  return id
}

function trimCache() {
  try {
    if (cache.size <= MAX_ENTRIES) return
    const keys = Array.from(cache.keys())
    const removeCount = cache.size - MAX_ENTRIES
    for (let i = 0; i < removeCount; i++) cache.delete(keys[i])
  } catch (e) {
    console.error('trimCache error', e)
  }
}

// Restrict which hosts we will proxy to avoid open proxy abuse
const PDF_WHITELIST = new Set([
  'ecommons.udayton.edu'
])

function isAllowedHost(url) {
  try {
    const u = new URL(url)
    return PDF_WHITELIST.has(u.hostname)
  } catch (e) {
    return false
  }
}

function makeQueryKey(body) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
  return `query:${hash}`
}

async function fetchRemote(id) {
  const RERUM = process.env.RERUM_API_BASE || 'https://store.rerum.io/v1'
  let url = id
  if (!id.startsWith('http')) url = `${RERUM}/id/${id}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Upstream ${res.status}`)
  const data = await res.json()
  return data
}

// GET /api/resource/:id[?refresh=true]
router.get('/resource/:id', async (req, res) => {
  const raw = req.params.id
  const refresh = req.query.refresh === 'true'
  if (!raw) return res.status(400).json({ error: 'Missing id' })

  const key = makeCacheKey(raw)
  const now = Date.now()

  if (!refresh && cache.has(key)) {
    const entr = cache.get(key)
    if (entr.expires > now) {
      return res.json(entr.data)
    }
  }

  try {
    const data = await fetchRemote(raw)
    cache.set(key, { data, expires: Date.now() + DEFAULT_TTL_MS })
    trimCache()
    return res.json(data)
  } catch (err) {
    console.error('Proxy fetch error', err)
    // If we have stale cache, return it with 206
    if (cache.has(key)) {
      const entr = cache.get(key)
      return res.status(206).json(entr.data)
    }
    return res.status(502).json({ error: 'Upstream fetch failed' })
  }
})

// POST /api/query[?refresh=true]
router.post('/query', async (req, res) => {
  const refresh = req.query.refresh === 'true'
  const body = req.body
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Missing query body' })
  }

  const key = makeQueryKey(body)
  const now = Date.now()

  if (!refresh && cache.has(key)) {
    const entr = cache.get(key)
    if (entr.expires > now) {
      return res.json({ cached: true, data: entr.data })
    }
  }

  try {
    const upstream = await fetch(QUERY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (!upstream.ok) throw new Error(`Upstream ${upstream.status}`)
    const data = await upstream.json()
    cache.set(key, { data, expires: Date.now() + DEFAULT_TTL_MS })
    trimCache()
    return res.json(data)
  } catch (err) {
    console.error('Proxy query error', err)
    if (cache.has(key)) {
      const entr = cache.get(key)
      return res.status(206).json(entr.data)
    }
    return res.status(502).json({ error: 'Upstream query failed' })
  }
})

// GET /api/pdf?src=<url>
// Fetches PDF bytes server-side for allowed hosts and streams them back as application/pdf.
// If the upstream responds with HTML that appears to be an interactive JS challenge, we return 422
// so the client can fall back to opening the original URL in a new tab.
router.get('/pdf', async (req, res) => {
  const src = req.query.src
  if (!src) return res.status(400).json({ error: 'Missing src param' })
  if (!isAllowedHost(src)) return res.status(403).json({ error: 'Host not allowed' })

  // Do not cache PDF responses to avoid serving stale challenge/redirect pages.
  // Always fetch PDFs live from the upstream host.

  try {
    const upstream = await fetch(src, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DLA-proxy/1.0)'
      }
    })

    if (!upstream.ok) return res.status(502).json({ error: `Upstream ${upstream.status}` })

    const ctype = (upstream.headers.get('content-type') || '').toLowerCase()

    if (ctype.includes('application/pdf') || ctype.includes('application/x-pdf') || ctype.includes('application/octet-stream')) {
      const arr = await upstream.arrayBuffer()
      const buffer = Buffer.from(arr)
      const headers = { 'Content-Type': 'application/pdf' }
      const clen = upstream.headers.get('content-length')
      if (clen) headers['Content-Length'] = clen

      // Send PDFs directly and do not cache them in server memory.
      res.set(headers)
      return res.send(buffer)
    }

    // upstream is not PDF — check if it is the JS challenge page
    const text = await upstream.text()
    if (/AwsWafIntegration|challenge\.js|JavaScript is disabled/i.test(text)) {
      return res.status(422).json({ error: 'Upstream requires interactive JavaScript challenge', challenge: true })
    }

    return res.status(415).json({ error: 'Upstream is not a PDF', contentType: ctype })
  } catch (err) {
    console.error('PDF proxy error', err)
    return res.status(502).json({ error: 'Upstream fetch failed' })
  }
})

export default router
