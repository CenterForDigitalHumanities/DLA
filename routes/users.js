/**
 * @mothballed - We will not manage in the current interface; it is readonly
 */
var express = require('express')
var router = express.Router()

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send({user:"username",id:12})
})

module.exports = router
