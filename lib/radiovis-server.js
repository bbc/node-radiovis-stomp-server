'use strict'

var net = require('net')
var RadioVisService = require('./radiovis-service')
var StompConnection = require('./stomp/connection')
var AdminServer = require('./admin-server')

function RadioVisServer (settings, serviceData) {
  this.stompPort = settings.stompPort || 61613
  this.stompHost = settings.stompHost || '0.0.0.0'
  this.adminPort = settings.adminPort || 7443
  this.adminHost = settings.adminHost || '127.0.0.1'

  this.topicMap = {}
  this.connections = []
  this.services = RadioVisService.initServices(serviceData)
  this.initTopicMap()
}

RadioVisServer.prototype.initTopicMap = function () {
  var server = this

  for (var serviceId in this.services) {
    this.services[serviceId].topics().forEach(function (topic) {
      server.topicMap[topic] = {
        'serviceId': serviceId,
        'subscribers': {
          'image': [],
          'text': []
        }
      }
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

RadioVisServer.prototype.countConnections = function () {
  var server = this

  // First count the number of unique connections for each service
  for (var serviceId in server.services) {
    var service = this.services[serviceId]
    var connections = []
    service.topics().forEach(function (topic) {
      var subscribers = server.topicMap[topic]['subscribers']
      for (var type in subscribers) {
        subscribers[type].forEach(function (connection) {
          if (!connections.includes(connection)) {
            connections.push(connection)
          }
        })
      }
    })
    service.connectionCount = connections.length
  }

  // The return a list of service IDs, ordered by the number of connections
  var serviceList = Object.keys(server.services)
  return serviceList.sort().sort(function (a, b) {
    if (server.services[b].connectionCount !== server.services[a].connectionCount) {
      return server.services[b].connectionCount - server.services[a].connectionCount
    } else if (server.services[a].name < server.services[b].name) {
      return -1
    } else {
      return 1
    }
  })
}

RadioVisServer.prototype.addSubscription = function (connection, topicId, type) {
  if (!this.topicMap[topicId]['subscribers'][type].includes(connection)) {
    this.topicMap[topicId]['subscribers'][type].push(connection)
  }
  if (!connection.subscriptions[topicId]) {
    connection.subscriptions[topicId] = []
  }
  if (!connection.subscriptions[topicId].includes(type)) {
    connection.subscriptions[topicId].push(type)
  }
}

RadioVisServer.prototype.removeSubscription = function (connection, topicId, type) {
  var index = this.topicMap[topicId]['subscribers'][type].indexOf(connection)
  if (index > -1) {
    this.topicMap[topicId]['subscribers'][type].splice(index, 1)
  }
  if (connection.subscriptions[topicId]) {
    var typeIndex = connection.subscriptions[topicId].indexOf(type)
    if (typeIndex > -1) {
      connection.subscriptions[topicId].splice(typeIndex, 1)
    }
  }
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
