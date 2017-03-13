'use strict'

var assert = require('assert')
var StompFrame = require('../../lib/stomp/frame')

describe('CONNECT frame', () => {
  it('should parse the frame correctly', (done) => {
    var buffer = new Buffer('CONNECT\x0A\x0A\x00')
    var frame = StompFrame.parse(buffer)
    assert.equal(frame.command, 'CONNECT')
    assert.deepEqual(frame.headers, {})
    assert.equal(frame.body, '')
    done()
  })

  it('should generate a frame correctly', (done) => {
    var frame = new StompFrame('CONNECT')
    assert.equal(frame.toBuffer(), 'CONNECT\x0A\x0A\x00')
    done()
  })
})

describe('SUBSCRIBE frame', () => {
  it('should parse the frame correctly', (done) => {
    var buffer = new Buffer('SUBSCRIBE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0Aack:auto\x0A\x0A\x00')
    var frame = StompFrame.parse(buffer)
    assert.equal(frame.command, 'SUBSCRIBE')
    assert.deepEqual(frame.headers, {'destination': '/topic/fm/ce1/c201/09880/text', 'ack': 'auto'})
    assert.equal(frame.body, '')
    done()
  })

  it('should generate a frame correctly', (done) => {
    var frame = new StompFrame('SUBSCRIBE', {'destination': '/topic/fm/ce1/c201/09880/text', 'ack': 'auto'})
    assert.equal(frame.toBuffer(), 'SUBSCRIBE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0Aack:auto\x0A\x0A\x00')
    done()
  })
})

describe('MESSAGE frame', () => {
  it('should parse the frame correctly', (done) => {
    var buffer = new Buffer('MESSAGE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0A\x0AHello World\x00')
    var frame = StompFrame.parse(buffer)
    assert.equal(frame.command, 'MESSAGE')
    assert.deepEqual(frame.headers, {'destination': '/topic/fm/ce1/c201/09880/text'})
    assert.equal(frame.body, 'Hello World')
    done()
  })

  it('should generate a frame correctly', (done) => {
    var frame = new StompFrame(
      'MESSAGE',
      {
        'destination': '/topic/fm/ce1/c201/09880/image',
        'link': 'http://www.bbc.co.uk/'
      },
      'SHOW http://static.bbci.co.uk/radiovis/1.1.0/logos/bbc_radio_one.png'
    )
    assert.equal(
      frame.toBuffer(),
      'MESSAGE\x0Adestination:/topic/fm/ce1/c201/09880/image\x0Alink:http://www.bbc.co.uk/\x0A\x0A' +
      'SHOW http://static.bbci.co.uk/radiovis/1.1.0/logos/bbc_radio_one.png\x00'
    )
    done()
  })
})
