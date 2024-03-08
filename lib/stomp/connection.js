'use strict'

const StompFrame = require('./frame')
const { v1: uuidv1 } = require('uuid')

const DEFAULT_BUFFER_SIZE = 2048
const CONNECT_TIMEOUT_SECS = 10

function StompConnection (socket, server) {
  this.socket = socket
  this.server = server
  this.session_id = uuidv1()
  this.buffer = Buffer.alloc(DEFAULT_BUFFER_SIZE)
  this.buffer.used = 0
  this.connected = true
  this.subscriptions = {}

  this.socket.on('data', this.handleData.bind(this))
  this.socket.on('error', this.handleError.bind(this))
  this.socket.on('close', this.handleDisconnect.bind(this))

  // Disconnect clients if they don't send CONNECT
  const connection = this
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

  let start = 0
  while (this.connected) {
    const end = this.buffer.indexOf('\0', start)
    if (end > 0 && end < this.buffer.used) {
      const frame = StompFrame.parse(
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
  const remaining = this.buffer.used - start
  if (remaining > 0) {
    // FIXME: can we do this without allocation a new buffer?
    const newBuf = Buffer.alloc(DEFAULT_BUFFER_SIZE)
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
      { session: this.session_id, version: '1.0' }
    ).toBuffer()
  )
}

StompConnection.prototype.parseTopic = function (frame) {
  const destination = frame.headers.destination
  if (!destination) {
    this.sendError('No destination topic given')
    return
  }

  // Verify the the topic is valid
  const matches = destination.match(/^\/topic\/([/\w]+)\/(image|text)$/)
  if (!matches) {
    this.sendError('Invalid Topic Name')
    return
  }

  // Verify the Bearer (FM Frequency / DAB ID)
  const topicId = matches[1]
  const type = matches[2]
  const topic = this.server.topicMap[topicId]
  if (!topic || !topic.serviceId) {
    this.sendError('Invalid Bearer in topic path')
    return
  }

  return {
    serviceId: topic.serviceId,
    topicId,
    type
  }
}

StompConnection.prototype.handleSubscribe = function (frame) {
  const params = this.parseTopic(frame)
  if (!params) {
    return
  }

  // Add this connection as a subscriber
  this.server.addSubscription(this, params.topicId, params.type)

  // Send a receipt, if requested
  if (frame.headers.receipt) {
    const receipt = new StompFrame(
      'RECEIPT',
      { 'receipt-id': frame.headers.receipt }
    )
    this.socket.write(receipt.toBuffer())
  }

  // Send the current message to the client
  this.publish(params.serviceId, params.topicId, params.type)
}

StompConnection.prototype.handleUnsubscribe = function (frame) {
  const params = this.parseTopic(frame)
  if (!params) {
    return
  }

  this.server.removeSubscription(this, params.topicId, params.type)
}

StompConnection.prototype.publish = function (serviceId, topicId, type) {
  const topic = '/topic/' + topicId + '/' + type
  const message = new StompFrame('message', { destination: topic })
  const service = this.server.services[serviceId]

  if (type === 'text') {
    message.body = 'TEXT ' + service.text
  } else if (type === 'image') {
    if (service.link) {
      message.headers.link = service.link
    }
    message.body = 'SHOW ' + service.image
  } else {
    return
  }

  message.headers['message-id'] = uuidv1()
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
    const conn = this
    const topicIds = Object.keys(conn.subscriptions)
    topicIds.forEach(function (topicId) {
      const types = Array.from(conn.subscriptions[topicId])
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
  const frame = new StompFrame('ERROR', { message: errorMessage })

  this.socket.write(frame.toBuffer())

  this.handleDisconnect()
}

module.exports = StompConnection
