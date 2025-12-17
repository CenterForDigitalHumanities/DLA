import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"
const COLLECTIONS = "https://store.rerum.io/v1/id/6353016612678843589262b0"

/* Collections API */
router.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '../components/collections') })
})

export default router
