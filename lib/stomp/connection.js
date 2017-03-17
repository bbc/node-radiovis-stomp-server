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
  this.socket.on('data', this.handleData.bind(this))
  this.socket.on('end', this.handleDisconnect.bind(this))

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
    console.log("ERROR: Buffer isn't big enough!")
    // FIXME: terminate connection on buffer overrun
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
    // FIXME: implement UNSUBSCRIBE
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
      {'session': this.session_id}
    ).toBuffer()
  )
}

StompConnection.prototype.handleSubscribe = function (frame) {
  var topic = frame.headers['destination']

  // Verify the the topic is valid
  var matches = topic.match(/^\/topic\/([/\w]+)\/(image|text)$/)
  if (!matches) {
    this.sendError('Invalid Topic Name')
    return
  }

  // Verify the Bearer (FM Frequency / DAB ID)
  var serviceId = this.server.topicMap[matches[1]]
  var type = matches[2]
  var service = this.server.services[serviceId]
  if (!service) {
    this.sendError('Invalid Topic Bearer')
    return
  }

  // Acknowledge the subscription
  this.socket.write(
    new StompFrame(
      'RECEIPT',
      {'receipt-id': frame.headers['receipt']}
    ).toBuffer()
  )

  // Send the default message
  this.sendDefaultMessage(topic, service, type)
}

StompConnection.prototype.sendDefaultMessage = function (topic, service, type) {
  var message = new StompFrame('message', {'destination': topic})

  if (type === 'text') {
    message.body = 'TEXT You are listening to ' + service.name
  } else if (type === 'image') {
    message.headers['link'] = service.default_link_url
    message.body = 'SHOW ' + service.default_image_url
  } else {
    return
  }

  message.headers['message-id'] = uuidV1()
  message.headers['content-type'] = 'text/plain'
  message.headers['content-length'] = message.body.length

  this.socket.write(message.toBuffer())
}

StompConnection.prototype.handleDisconnect = function () {
  if (this.connected) {
    // Remove references to this connection
    this.server.removeConnection(this)

    // We use this to avoid handling any further frames after disconnecting
    this.connected = false

    // Close the socket
    this.socket.end()
  }
}

StompConnection.prototype.sendError = function (errorMessage) {
  var frame = new StompFrame('ERROR', {'message': errorMessage})

  this.socket.write(frame.toBuffer())

  this.handleDisconnect()
}

module.exports = StompConnection
