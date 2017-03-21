'use strict'

var net = require('net')
var StompConnection = require('./stomp/connection')
var AdminServer = require('./admin-server')

function RadioVisServer (settings, services) {
  this.stompPort = settings.stompPort || 61613
  this.stompHost = settings.stompHost || '0.0.0.0'
  this.adminPort = settings.adminPort || 3000
  this.adminHost = settings.adminHost || '127.0.0.1'
  this.services = services
  this.connections = []
  this.topicMap = {}

  var server = this
  for (var serviceId in server.services) {
    server.services[serviceId].bearers.forEach(function (bearerId) {
      var topicId = bearerId.replace(/\W/g, '/')
      server.topicMap[topicId] = serviceId
    })
  }
}

RadioVisServer.prototype.addConnection = function (connection) {
  this.connections.push(connection)
  // console.log('Active STOMP connections: ' + this.connections.length)
}

RadioVisServer.prototype.removeConnection = function (connection) {
  var index = this.connections.indexOf(connection)
  if (index > -1) {
    this.connections.splice(index, 1)
  }
  // console.log('Active STOMP connections: ' + this.connections.length)
}

RadioVisServer.prototype.start = function () {
  var self = this

  // Start the HTTP Admin server
  var admin = AdminServer(this)
  admin.listen(self.adminPort, self.adminHost, function () {
    console.log('Now listening for admin on: http://' + self.adminHost + ':' + self.adminPort + '/')
  })

  // Start the STOMP server
  self.socket = net.createServer(function (socket) {
    var connection = new StompConnection(socket, self)
    self.addConnection(connection)
  })
  self.socket.on('error', function (err) {
    console.log('Server socket error: ' + err)
  })
  self.socket.listen(self.stompPort, self.stompHost, function () {
    console.log('Now listening for STOMP on: ' + self.stompHost + ':' + self.stompPort)
  })
}

module.exports = RadioVisServer
