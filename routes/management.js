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
router.post('/update', (req, res) => {
  fetch(`${RERUM}/update.action`, {
    method: 'PUT',
    'Content-Type': 'application/json; charset=utf-8',
    'Authorization': `Bearer ${pubTok}`,
    mode: 'cors',
    redirect: 'follow',
    body: req.body
  }).then(response => response.ok ? response.json() : Promise.reject(response))
})

export default router
