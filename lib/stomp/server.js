'use strict'

var net = require('net')
var StompConnection = require('./connection')

function StompServer (settings, services) {
  this.port = settings.stompPort || 61613
  this.hostname = settings.stompHost || '0.0.0.0'
  this.services = services
  this.connections = []
}

StompServer.prototype.start = function () {
  var self = this
  this.socket = net.createServer(function (socket) {
    var connection = new StompConnection(socket, self)
    self.connections.push(connection)
  })
  this.socket.listen(this.port, this.hostname)
  console.log('Now listening on: ' + this.hostname + ':' + this.port)
}

module.exports = StompServer
