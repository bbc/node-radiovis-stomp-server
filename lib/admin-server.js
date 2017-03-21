'use strict'

var express = require('express')

module.exports = function (radiovis) {
  var app = express()

  app.set('view engine', 'ejs')

  app.get('/', function (req, res) {
    res.render('index', {
      'clientCount': radiovis.connections.length
    })
  })

  app.use(
    express.static('public')
  )

  return app
}
