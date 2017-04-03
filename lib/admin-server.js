'use strict'

var express = require('express')
var moment = require('moment')
var os = require('os')

module.exports = function (radiovis) {
  var app = express()

  app.set('view engine', 'ejs')

  app.get('/', function (req, res) {
    res.redirect('/info')
  })

  app.get('/status', function (req, res) {
    // For use by monitoring software
    res.set('Content-Type', 'text/plain')
    res.send('OK')
  })

  app.get('/info', function (req, res) {
    res.render('info', {
      'clientCount': radiovis.connections.length,
      'radioVisUptime': moment.duration(process.uptime(), 'seconds'),
      'osUptime': moment.duration(os.uptime(), 'seconds'),
      'loadAvg': os.loadavg().map(function (f) { return f.toFixed(1) }).join(', '),
      'services': radiovis.services,
      'orderedServices': radiovis.countConnections()
    })
  })

  app.get('/services/:serviceId.:format?', function (req, res) {
    var serviceId = req.params['serviceId']
    var service = radiovis.services[serviceId]
    if (!service) {
      res.status(404).send('Service Not Found')
      return
    }

    var params = {'service': service}
    switch (req.params.format || 'html') {
      case 'html':
        res.render('service', params)
        break

      case 'json':
        res.json(params)
        break

      default:
        res.set('Content-Type', 'text/plain')
        res.status(404).send('Format not supported')
        break
    }
  })

  app.use(
    express.static('public')
  )

  return app
}
