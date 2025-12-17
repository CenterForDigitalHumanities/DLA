/**
 * @mothballed - We will not manage in the current interface; it is readonly
 */
import express from 'express'

const router = express.Router()

/* GET users listing. */
router.get('/', (req, res) => {
  res.send({ user: 'username', id: 12 })
})

export default router
