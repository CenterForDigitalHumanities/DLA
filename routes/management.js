/**
 * @mothballed - We will not manage in the current interface; it is readonly
 */

import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

const pubTok = process.env.RERUM_API
const RERUM = "http://store.rerum.io/v1"

router.use((req, res, next) => {
  if (req.headers.Agent) {
    next()
  } else {
    res.sendStatus(403)
  }
})

/* Management API */
router.post('/update', async (req, res) => {
  try {
    const response = await fetch(`${RERUM}/update.action`, {
      method: 'PUT',
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${pubTok}`,
      mode: 'cors',
      redirect: 'follow',
      body: req.body
    })
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Update failed' })
    }
    
    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Update error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
