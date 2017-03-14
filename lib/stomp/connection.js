'use strict'

var StompFrame = require('./frame')
var uuidV1 = require('uuid/v1')
var DEFAULT_BUFFER_SIZE = 2048

function StompConnection (socket, server) {
  this.socket = socket
  this.server = server
  this.session_id = uuidV1()
  this.buffer = new Buffer(DEFAULT_BUFFER_SIZE)
  this.buffer.used = 0
  this.socket.on('data', this.handleData.bind(this))
  this.socket.on('end', this.close.bind(this))
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
  while (true) {
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
    var newBuf = new Buffer(DEFAULT_BUFFER_SIZE + remaining)
    this.buffer.copy(newBuf, 0, start, this.buffer.used)
    newBuf.used = remaining
    this.buffer = newBuf
  } else {
    // Nothing left in the buffer
    this.buffer.used = 0
  }
}

StompConnection.prototype.handleFrame = function (frame) {
  var response

  if (frame.command === 'CONNECT') {
    response = new StompFrame(
          'CONNECTED',
          {'session': this.session_id}
    )
  } else if (frame.command === 'SUBSCRIBE') {
    response = new StompFrame(
          'RECEIPT',
          {'receipt-id': frame.headers['receipt']}
    )
  } else {
    console.log("Don't know how to handle: " + frame.command)
    response = new StompFrame(
          'ERROR',
          {},
          'Unable to handle command'
    )
    // FIXME: close socket
  }

  if (response) {
    this.socket.write(response.toBuffer())
  }
}

StompConnection.prototype.close = function (data) {
    // FIXME: tidy up here
}

module.exports = StompConnection
