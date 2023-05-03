var express = require('express')
var router = express.Router()
const path = require('path')
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"
const COLLECTIONS = "https://store.rerum.io/v1/id/6353016612678843589262b0"

/* Collections API */
router.get('/', function(req, res, next) {
 res.sendFile('index.html', { root: path.join(__dirname, '../components/collections') })
})

module.exports = router
