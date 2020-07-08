'use strict'

function StompFrame (command, headers, body) {
  // always initialize all instance properties
  this.command = command || ''
  this.headers = headers || {}
  this.body = body || ''
}

StompFrame.prototype.headersAsString = function () {
  let result = ''
  for (const key in this.headers) { result += key + ':' + this.headers[key] + '\x0A' }
  return result
}

// class methods
StompFrame.prototype.toBuffer = function () {
  const commandBuf = Buffer.from(this.command.toUpperCase(), 'utf8')
  const headersBuf = Buffer.from(this.headersAsString(), 'utf8')
  const bodyBuf = Buffer.from(this.body, 'utf8')
  const linefeedBuf = Buffer.from([0x0A])
  const nullBuf = Buffer.from([0x00])

  const totalLength = commandBuf.length + 1 + headersBuf.length + 1 + bodyBuf.length + 1
  return Buffer.concat(
    [
      commandBuf, linefeedBuf,
      headersBuf, linefeedBuf,
      bodyBuf, nullBuf
    ], totalLength
  )
}

StompFrame.parse = function (buffer) {
  const frame = new StompFrame()

  let start = 0
  let end
  for (let lineNo = 0; start < buffer.length; lineNo++) {
    const lf = buffer.indexOf(0x0A, start)
    const cr = buffer.indexOf(0x0D, start)
    if (cr > 0 && cr === (lf - 1)) {
      end = cr
    } else if (lf > 0) {
      end = lf
    } else {
      // Failed to parse header
      return undefined
    }

    const line = buffer.toString('utf8', start, end)
    if (lineNo === 0) {
      // First line: the command
      frame.command = line.trim()
    } else if (line.length > 0) {
      // Following lines: headers
      const colon = line.indexOf(':')
      const key = line.substring(0, colon).trim()
      const value = line.substring(colon + 1).trim()
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
