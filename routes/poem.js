var express = require('express')
var router = express.Router()
const path = require('path')
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"

/* Poem API */
router.get('/:poemID', function (req, res, next) {
    req.params.poemID.replace(/^https?/,'https')
    if (!req.params.poemID.startsWith("http")) {
        req.params.poemID = RERUM + "/id/" + req.params.poemID
    }
    res.sendFile('index.html', { root: path.join(__dirname, '../components/poem') })
})

module.exports = router
