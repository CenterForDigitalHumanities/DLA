var express = require('express')
var router = express.Router()
const path = require('path')
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "http://store.rerum.io/v1"

/* Collection API */
router.get('/:collectionID', function(req, res, next) {
    if(!req.params.collectionID.startsWith("http")) {
        req.params.collectionID = RERUM + "/id/" + req.params.collectionID
    }
//  res.send('index.html', { root: path.join(__dirname, '../components/collection') })
 res.send({ id: req.params.collectionID })
})

module.exports = router
