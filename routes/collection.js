import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"

/* Collection API */
router.get('/record/:recordID', (req, res) => {
  req.params.recordID = req.params.recordID.replace(/^https?/, 'https')
  if (!req.params.recordID.startsWith('http')) {
    req.params.recordID = `${RERUM}/id/${req.params.recordID}`
  }
  res.sendFile('record.html', { root: path.join(__dirname, '../components/collection') })
})

router.get('/:collectionID', (req, res) => {
  req.params.collectionID = req.params.collectionID.replace(/^https?/, 'https')
  if (!req.params.collectionID.startsWith('http')) {
    req.params.collectionID = `${RERUM}/id/${req.params.collectionID}`
  }
  res.sendFile('index.html', { root: path.join(__dirname, '../components/collection') })
})

export default router
