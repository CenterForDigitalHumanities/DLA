var express = require('express')
var router = express.Router()
const fetch = require('node-fetch')

const pubTok = process.env.RERUM_API
const RERUM = "http://store.rerum.io/v1"

router.use((req, res, next)=>{
  if(req.headers.Agent) {
    next()
  } else {
    res.sendStatus(403)
  }
})



/* Management API */
router.post('/update', function(req, res, next) {

  fetch(`${RERUM}/update.action`,{
    method:"PUT",
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Bearer "+pubTok,
    mode: "cors",
    redirect: "follow",
    body:req.body
  }).then(response=>response.ok?response.json():Promise.reject(response))
})


module.exports = router
