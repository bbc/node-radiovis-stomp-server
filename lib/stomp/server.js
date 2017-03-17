'use strict'

var net = require('net')
var StompConnection = require('./connection')

function StompServer (settings, services) {
  this.port = settings.stompPort || 61613
  this.hostname = settings.stompHost || '0.0.0.0'
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

StompServer.prototype.addConnection = function (connection) {
  this.connections.push(connection)
  // console.log('Active STOMP connections: ' + this.connections.length)
}

StompServer.prototype.removeConnection = function (connection) {
  var index = this.connections.indexOf(connection)
  if (index > -1) {
    this.connections.splice(index, 1)
  }
  // console.log('Active STOMP connections: ' + this.connections.length)
}

StompServer.prototype.start = function () {
  var self = this
  this.socket = net.createServer(function (socket) {
    var connection = new StompConnection(socket, self)
    self.addConnection(connection)
  })
  this.socket.listen(this.port, this.hostname)
  console.log('Now listening on: ' + this.hostname + ':' + this.port)
}

module.exports = StompServer
