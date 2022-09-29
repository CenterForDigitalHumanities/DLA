var express = require('express')
var router = express.Router()
const path = require('path')
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "http://store.rerum.io/v1"
const COLLECTIONS = "http://store.rerum.io/v1/id/615b724650c86821e60b11fa"

/* Collections API */
router.get('/', function(req, res, next) {
 res.sendFile('index.html', { root: path.join(__dirname, '../components/collections') })
})

module.exports = router
