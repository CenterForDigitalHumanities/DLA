var express = require('express')
var router = express.Router()
const path = require('path')
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "https://store.rerum.io/v1"

/* Collection API */
router.get('/record/:recordID', function (req, res, next) {
    req.params.recordID.replace(/^https?/,'https')
    if (!req.params.recordID.startsWith("http")) {
        req.params.recordID = RERUM + "/id/" + req.params.recordID
    }
    res.sendFile('record.html', { root: path.join(__dirname, '../components/collection') })
})

router.get('/:collectionID', function (req, res, next) {
    req.params.collectionID.replace(/^https?/,'https')
    if (!req.params.collectionID.startsWith("http")) {
        req.params.collectionID = RERUM + "/id/" + req.params.collectionID
    }
    res.sendFile('index.html', { root: path.join(__dirname, '../components/collection') })
})

module.exports = router
