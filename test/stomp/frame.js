'use strict'

var assert = require('assert')
var StompFrame = require('../../lib/stomp/frame')

describe('StompFrame', function () {
  describe('CONNECT frame', function () {
    it('should parse the frame correctly', function () {
      var buffer = Buffer.from('CONNECT\x0A\x0A\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'CONNECT')
      assert.deepStrictEqual(frame.headers, {})
      assert.strictEqual(frame.body, '')
    })

    it('should parse the frame with CR LF correctly', function () {
      var buffer = Buffer.from('CONNECT\x0D\x0A\x0D\x0A\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'CONNECT')
      assert.deepStrictEqual(frame.headers, {})
      assert.strictEqual(frame.body, '')
    })

    it('should be tolerant of whitespace before the frame command', function () {
      var buffer = Buffer.from('  CONNECT\x0D\x0A\x0D\x0A\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'CONNECT')
      assert.deepStrictEqual(frame.headers, {})
      assert.strictEqual(frame.body, '')
    })

    it('should generate a frame correctly', function () {
      var frame = new StompFrame('CONNECT')
      assert.strictEqual(frame.toBuffer().toString(), 'CONNECT\x0A\x0A\x00')
    })
  })

  describe('SUBSCRIBE frame', function () {
    it('should parse the frame correctly', function () {
      var buffer = Buffer.from('SUBSCRIBE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0Aack:auto\x0A\x0A\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })

    it('should parse the frame with CR LF correctly', function () {
      var buffer = Buffer.from('SUBSCRIBE\x0D\x0Adestination:/topic/fm/ce1/c201/09880/text\x0D\x0Aack:auto\x0D\x0A\x0D\x0A\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })

    it('should parse a header with a space after the colon', function () {
      var buffer = Buffer.from('SUBSCRIBE\x0Adestination: /topic/fm/ce1/c201/09880/text\x0Aack : auto\x0A\x0A\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })

    it('should generate a frame correctly', function () {
      var frame = new StompFrame('SUBSCRIBE', { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.toBuffer().toString(), 'SUBSCRIBE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0Aack:auto\x0A\x0A\x00')
    })
  })

  describe('MESSAGE frame', function () {
    it('should parse the frame correctly', function () {
      var buffer = Buffer.from('MESSAGE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0A\x0AHello World\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'MESSAGE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text' })
      assert.strictEqual(frame.body, 'Hello World')
    })

    it('should parse the frame with CR LF correctly', function () {
      var buffer = Buffer.from('MESSAGE\x0D\x0Adestination:/topic/fm/ce1/c201/09880/text\x0D\x0A\x0D\x0AHello World\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'MESSAGE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text' })
      assert.strictEqual(frame.body, 'Hello World')
    })

    it('should generate a frame correctly', function () {
      var frame = new StompFrame(
        'MESSAGE',
        {
          destination: '/topic/fm/ce1/c201/09880/image',
          link: 'http://www.bbc.co.uk/'
        },
        'SHOW http://static.bbci.co.uk/radiovis/1.1.0/logos/bbc_radio_one.png'
      )
      assert.strictEqual(
        frame.toBuffer().toString(),
        'MESSAGE\x0Adestination:/topic/fm/ce1/c201/09880/image\x0Alink:http://www.bbc.co.uk/\x0A\x0A' +
        'SHOW http://static.bbci.co.uk/radiovis/1.1.0/logos/bbc_radio_one.png\x00'
      )
    })
  })

  describe('Invalid frame', function () {
    it('parsing the frame should return undefined', function () {
      var buffer = Buffer.from('Foo Bar\x00')
      var frame = StompFrame.parse(buffer)
      assert.strictEqual(frame, undefined)
    })
  })
})
