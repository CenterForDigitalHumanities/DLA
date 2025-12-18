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

/* Collection API */
router.get('/record/:recordID', (req, res) => {
  const raw = req.params.recordID || ''
  if (!looksValid(raw)) return res.status(404).send(errorPage(404, 'Invalid or missing record identifier'))

  let recordID = raw.replace(/^https?/, 'https')
  if (!recordID.startsWith('http')) {
    recordID = `${RERUM}/id/${recordID}`
  }
  res.sendFile('record.html', { root: path.join(__dirname, '../components/collection') })
})

router.get('/:collectionID', (req, res) => {
  const raw = req.params.collectionID || ''
  if (!looksValid(raw)) return res.status(404).send(errorPage(404, 'Invalid or missing collection identifier'))

  let collectionID = raw.replace(/^https?/, 'https')
  if (!collectionID.startsWith('http')) {
    collectionID = `${RERUM}/id/${collectionID}`
  }
  res.sendFile('index.html', { root: path.join(__dirname, '../components/collection') })
})

export default router
