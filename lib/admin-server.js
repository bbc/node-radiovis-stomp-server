'use strict'

var express = require('express')
var app = express()

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.use(
  express.static('public')
)

module.exports = app
