'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var moment = require('moment')
var os = require('os')

module.exports = function (radiovis) {
  var app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: false}))

  app.set('view engine', 'ejs')

  app.get('/', function (req, res) {
    res.redirect('/info')
  })

  app.get('/status', function (req, res) {
    // For use by monitoring software
    res.set('Content-Type', 'text/plain')
    res.send('OK\n')
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
      res.set('Content-Type', 'text/plain')
      res.status(404).send('Service Not Found\n')
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
        res.status(404).send('Format not supported\n')
        break
    }
  })

  app.post('/services/:serviceId', function (req, res) {
    var serviceId = req.params['serviceId']
    var service = radiovis.services[serviceId]
    if (!service) {
      res.set('Content-Type', 'text/plain')
      res.status(404).send('Service Not Found\n')
      return
    }

    var text = req.body.text || req.query.text
    var image = req.body.image || req.query.image
    var link = req.body.link || req.query.link
    if (!text && !image) {
      res.set('Content-Type', 'text/plain')
      res.send('Error: no image or text given\n')
      return
    }

    if (text) {
      service.updateText(text)
      radiovis.publish(serviceId, 'text')
    }

    if (image) {
      service.updateImage(image, link)
      radiovis.publish(serviceId, 'image')
    }

    res.set('Content-Type', 'text/plain')
    res.send('Content Published\n')
  })

  app.use(
    express.static('public')
  )

  return app
}
