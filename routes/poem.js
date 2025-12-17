import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"

/* Poem API */
router.get('/:poemID', (req, res) => {
  req.params.poemID = req.params.poemID.replace(/^https?/, 'https')
  if (!req.params.poemID.startsWith('http')) {
    req.params.poemID = `${RERUM}/id/${req.params.poemID}`
  }
  res.sendFile('index.html', { root: path.join(__dirname, '../components/poem') })
})

export default router
