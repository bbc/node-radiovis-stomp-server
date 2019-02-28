'use strict'

var StompFrame = require('./frame')
var uuidV1 = require('uuid/v1')

var DEFAULT_BUFFER_SIZE = 2048
var CONNECT_TIMEOUT_SECS = 10

function StompConnection (socket, server) {
  this.socket = socket
  this.server = server
  this.session_id = uuidV1()
  this.buffer = new Buffer(DEFAULT_BUFFER_SIZE)
  this.buffer.used = 0
  this.connected = true
  this.subscriptions = {}

  this.socket.on('data', this.handleData.bind(this))
  this.socket.on('error', this.handleError.bind(this))
  this.socket.on('close', this.handleDisconnect.bind(this))

  // Disconnect clients if they don't send CONNECT
  var connection = this
  this.connectTimer = setTimeout(function () {
    connection.sendError('Timed out waiting for CONNECT')
  },
  CONNECT_TIMEOUT_SECS * 1000
  )
}

StompConnection.prototype.handleData = function (data) {
  if ((this.buffer.length - this.buffer.used) < data.length) {
    this.sendError('Client sent too much data')
    return
  }

  // FIXME: don't copy into a separate buffer unless we need to?
  data.copy(this.buffer, this.buffer.used)
  this.buffer.used += data.length

  var start = 0
  while (this.connected) {
    var end = this.buffer.indexOf('\0', start)
    if (end > 0 && end < this.buffer.used) {
      var frame = StompFrame.parse(
        this.buffer.slice(start, end)
      )
      if (!frame) {
        this.sendError('Unable to parse STOMP frame')
        return
      }
      this.handleFrame(frame)
      start = end + 1
    } else {
      break
    }
  }

  // Store anything left for later
  var remaining = this.buffer.used - start
  if (remaining > 0) {
    // FIXME: can we do this without allocation a new buffer?
    var newBuf = new Buffer(DEFAULT_BUFFER_SIZE)
    this.buffer.copy(newBuf, 0, start, this.buffer.used)
    newBuf.used = remaining
    this.buffer = newBuf
  } else {
    // Nothing left in the buffer
    this.buffer.used = 0
  }
}

StompConnection.prototype.handleFrame = function (frame) {
  if (frame.command === 'CONNECT') {
    this.handleConnect(frame)
  } else if (frame.command === 'SUBSCRIBE') {
    this.handleSubscribe(frame)
  } else if (frame.command === 'UNSUBSCRIBE') {
    this.handleUnsubscribe(frame)
  } else if (frame.command === 'ACK') {
    // Silently ignore ACKs
  } else if (frame.command === 'DISCONNECT') {
    this.handleDisconnect()
  } else {
    this.sendError('Unsupported STOMP command: ' + frame.command)
  }
}

StompConnection.prototype.handleConnect = function (frame) {
  clearTimeout(this.connectTimer)

  this.socket.write(
    new StompFrame(
      'CONNECTED',
      { 'session': this.session_id, 'version': '1.0' }
    ).toBuffer()
  )
}

StompConnection.prototype.parseTopic = function (frame) {
  var destination = frame.headers['destination']
  if (!destination) {
    this.sendError('No destination topic given')
    return
  }

  // Verify the the topic is valid
  var matches = destination.match(/^\/topic\/([/\w]+)\/(image|text)$/)
  if (!matches) {
    this.sendError('Invalid Topic Name')
    return
  }

  // Verify the Bearer (FM Frequency / DAB ID)
  var topicId = matches[1]
  var type = matches[2]
  var topic = this.server.topicMap[topicId]
  if (!topic || !topic.serviceId) {
    this.sendError('Invalid Bearer in topic path')
    return
  }

  return {
    'serviceId': topic.serviceId,
    'topicId': topicId,
    'type': type
  }
}

StompConnection.prototype.handleSubscribe = function (frame) {
  var params = this.parseTopic(frame)
  if (!params) {
    return
  }

  // Add this connection as a subscriber
  this.server.addSubscription(this, params.topicId, params.type)

  // Send a receipt, if requested
  if (frame.headers['receipt']) {
    var receipt = new StompFrame(
      'RECEIPT',
      { 'receipt-id': frame.headers['receipt'] }
    )
    this.socket.write(receipt.toBuffer())
  }

  // Send the current message to the client
  this.publish(params.serviceId, params.topicId, params.type)
}

StompConnection.prototype.handleUnsubscribe = function (frame) {
  var params = this.parseTopic(frame)
  if (!params) {
    return
  }

  this.server.removeSubscription(this, params.topicId, params.type)
}

StompConnection.prototype.publish = function (serviceId, topicId, type) {
  var topic = '/topic/' + topicId + '/' + type
  var message = new StompFrame('message', { 'destination': topic })
  var service = this.server.services[serviceId]

  if (type === 'text') {
    message.body = 'TEXT ' + service.text
  } else if (type === 'image') {
    if (service.link) {
      message.headers['link'] = service.link
    }
    message.body = 'SHOW ' + service.image
  } else {
    return
  }

  message.headers['message-id'] = uuidV1()
  message.headers['trigger-time'] = 'NOW'
  message.headers['content-type'] = 'text/plain'
  message.headers['content-length'] = message.body.length

  this.socket.write(message.toBuffer())
}

StompConnection.prototype.handleError = function (err) {
  // FIXME: use a logger instead?
  console.log('Client socket error: ' + err)
}

StompConnection.prototype.handleDisconnect = function () {
  clearTimeout(this.connectTimer)

  if (this.connected) {
    // Remove all subscriptions
    var conn = this
    var topicIds = Object.keys(conn.subscriptions)
    topicIds.forEach(function (topicId) {
      var types = Array.from(conn.subscriptions[topicId])
      types.forEach(function (type) {
        conn.server.removeSubscription(conn, topicId, type)
      })
    })

    // Remove references to this connection
    this.server.removeConnection(this)

    // We use this to avoid handling any further frames after disconnecting
    this.connected = false

    // Close the socket
    this.socket.end()
  }
}

StompConnection.prototype.sendError = function (errorMessage) {
  var frame = new StompFrame('ERROR', { 'message': errorMessage })

  this.socket.write(frame.toBuffer())

  this.handleDisconnect()
}

module.exports = StompConnection
