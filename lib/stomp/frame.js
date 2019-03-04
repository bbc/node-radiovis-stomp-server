'use strict'

function StompFrame (command, headers, body) {
  // always initialize all instance properties
  this.command = command || ''
  this.headers = headers || {}
  this.body = body || ''
}

StompFrame.prototype.headersAsString = function () {
  var result = ''
  for (var key in this.headers) { result += key + ':' + this.headers[key] + '\x0A' }
  return result
}

// class methods
StompFrame.prototype.toBuffer = function () {
  var commandBuf = Buffer.from(this.command.toUpperCase(), 'utf8')
  var headersBuf = Buffer.from(this.headersAsString(), 'utf8')
  var bodyBuf = Buffer.from(this.body, 'utf8')
  var linefeedBuf = Buffer.from([0x0A])
  var nullBuf = Buffer.from([0x00])

  var totalLength = commandBuf.length + 1 + headersBuf.length + 1 + bodyBuf.length + 1
  return Buffer.concat(
    [
      commandBuf, linefeedBuf,
      headersBuf, linefeedBuf,
      bodyBuf, nullBuf
    ], totalLength
  )
}

StompFrame.parse = function (buffer) {
  var frame = new StompFrame()

  var start = 0
  var end
  for (var lineNo = 0; start < buffer.length; lineNo++) {
    var lf = buffer.indexOf(0x0A, start)
    var cr = buffer.indexOf(0x0D, start)
    if (cr > 0 && cr === (lf - 1)) {
      end = cr
    } else if (lf > 0) {
      end = lf
    } else {
      // Failed to parse header
      return undefined
    }

    var line = buffer.toString('utf8', start, end)
    if (lineNo === 0) {
      // First line: the command
      frame.command = line.trim()
    } else if (line.length > 0) {
      // Following lines: headers
      var colon = line.indexOf(':')
      var key = line.substring(0, colon).trim()
      var value = line.substring(colon + 1).trim()
      frame.headers[key] = value
    } else {
      // After the last header line is the body
      frame.body = buffer.toString('utf8', lf + 1, buffer.length - 1)
      break
    }

    start = lf + 1
  }

  return frame
}

module.exports = StompFrame
