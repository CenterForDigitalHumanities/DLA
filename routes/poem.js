import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { errorPage } from '../utils/errorPage.js'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"

function looksValid(id) {
  if (!id || typeof id !== 'string') return false
  if (id.includes('..') || /\s/.test(id) || id.includes('\\')) return false
  if (id.length > 1024) return false
  return true
}

/* Poem API */
router.get('/:poemID', (req, res) => {
  const raw = req.params.poemID || ''
  if (!looksValid(raw)) return res.status(404).send(errorPage(404, 'Invalid or missing poem identifier'))

  let poemID = raw.replace(/^https?/, 'https')
  if (!poemID.startsWith('http')) {
    poemID = `${RERUM}/id/${poemID}`
  }
  res.sendFile('index.html', { root: path.join(__dirname, '../components/poem') })
})

export default router
