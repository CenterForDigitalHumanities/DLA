var express = require('express')
var router = express.Router()
const path = require('path')
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "http://store.rerum.io/v1"

/* Collection API */
router.get('/record/:recordID', function (req, res, next) {
    if (!req.params.recordID.startsWith("http")) {
        req.params.recordID = RERUM + "/id/" + req.params.recordID
    }
    res.sendFile('record.html', { root: path.join(__dirname, '../components/collection') })
})

router.get('/:collectionID', function (req, res, next) {
    if (!req.params.collectionID.startsWith("http")) {
        req.params.collectionID = RERUM + "/id/" + req.params.collectionID
    }
    res.sendFile('index.html', { root: path.join(__dirname, '../components/collection') })
})

module.exports = router
