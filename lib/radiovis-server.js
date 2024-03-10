'use strict'

const net = require('net')
const RadioVisService = require('./radiovis-service')
const StompConnection = require('./stomp/connection')
const AdminServer = require('./admin-server')

function RadioVisServer (settings, serviceData) {
  this.stompPort = settings.stompPort || 61613
  this.stompHost = settings.stompHost || '0.0.0.0'
  this.adminPort = settings.adminPort || 3000
  this.adminHost = settings.adminHost || '127.0.0.1'
  this.wildcard = settings.wildcard || false;

  this.topicMap = {}
  this.connections = []
  this.services = RadioVisService.initServices(serviceData)
  this.initTopicMap()

  if (settings.republishFrequency) {
    this.initRepublishTimer(settings.republishFrequency)
  }
}

RadioVisServer.prototype.initTopicMap = function () {
  const server = this

  for (const serviceId in this.services) {
    this.services[serviceId].topics().forEach(function (topicId) {
      server.topicMap[topicId] = {
        serviceId,
        subscribers: {
          image: [],
          text: []
        }
      }
    })
  }

  if (this.wildcard) {
    server.topicMap['*'] = {
      serviceId: '*',
      subscribers: {
        image: [],
        text: []
      }
    }
  }
}

RadioVisServer.prototype.initRepublishTimer = function (frequency) {
  const server = this

  setInterval(function () {
    const moreRecentThan = Date.now() - (frequency * 1000)
    for (const serviceId in server.services) {
      const service = server.services[serviceId]
      const types = ['image', 'text']
      types.forEach(function (type) {
        if (service.updatedAt[type].getTime() < moreRecentThan) {
          server.publish(serviceId, type)
        }
      })
    }
  }, frequency * 1000)
}

RadioVisServer.prototype.addConnection = function (connection) {
  this.connections.push(connection)
  // console.log('Active STOMP connections: ' + this.connections.length)
}

RadioVisServer.prototype.removeConnection = function (connection) {
  const index = this.connections.indexOf(connection)
  if (index > -1) {
    this.connections.splice(index, 1)
  }
  // console.log('Active STOMP connections: ' + this.connections.length)
}

RadioVisServer.prototype.countConnections = function () {
  const server = this

  // First count the number of unique connections for each service
  for (const serviceId in server.services) {
    const service = this.services[serviceId]
    const connections = []
    service.topics().forEach(function (topicId) {
      const subscribers = server.topicMap[topicId].subscribers
      for (const type in subscribers) {
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
  const serviceList = Object.keys(server.services)
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
  if (!this.topicMap[topicId].subscribers[type].includes(connection)) {
    this.topicMap[topicId].subscribers[type].push(connection)
  }
  if (!connection.subscriptions[topicId]) {
    connection.subscriptions[topicId] = []
  }
  if (!connection.subscriptions[topicId].includes(type)) {
    connection.subscriptions[topicId].push(type)
  }
}

RadioVisServer.prototype.removeSubscription = function (connection, topicId, type) {
  const index = this.topicMap[topicId].subscribers[type].indexOf(connection)
  if (index > -1) {
    this.topicMap[topicId].subscribers[type].splice(index, 1)
  }
  if (connection.subscriptions[topicId]) {
    const typeIndex = connection.subscriptions[topicId].indexOf(type)
    if (typeIndex > -1) {
      connection.subscriptions[topicId].splice(typeIndex, 1)
    }
  }
}

RadioVisServer.prototype.publish = function (serviceId, type) {
  const server = this
  const service = this.services[serviceId]
  service.topics().forEach(function (topicId) {
    const subscribers = server.topicMap[topicId].subscribers[type]
    subscribers.forEach(function (connection) {
      connection.publish(serviceId, topicId, type)
    })
  })
  // if wildcard is configured, also dispatch to wildcard subscribers
  if (this.wildcard) {
    const [topicId] = service.topics() // only the first topic, to avoid duplication
    const subscribers = this.topicMap['*'].subscribers[type]
    subscribers.forEach(function (connection) {
      connection.publish(serviceId, topicId, type)
    })
  }
}

RadioVisServer.prototype.start = function () {
  const self = this

  // Start the HTTP Admin server
  const admin = AdminServer(this)
  admin.listen(self.adminPort, self.adminHost, function () {
    console.log('Now listening for admin on: http://' + self.adminHost + ':' + self.adminPort + '/')
  })

  // Start the STOMP server
  self.socket = net.createServer(function (socket) {
    const connection = new StompConnection(socket, self)
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
