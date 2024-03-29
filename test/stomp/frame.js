'use strict'

const assert = require('assert')
const StompFrame = require('../../lib/stomp/frame')

describe('StompFrame', function () {
  describe('CONNECT frame', function () {
    it('should parse the frame correctly', function () {
      const buffer = Buffer.from('CONNECT\x0A\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'CONNECT')
      assert.deepStrictEqual(frame.headers, {})
      assert.strictEqual(frame.body, '')
    })

    it('should parse the frame with CR LF correctly', function () {
      const buffer = Buffer.from('CONNECT\x0D\x0A\x0D\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'CONNECT')
      assert.deepStrictEqual(frame.headers, {})
      assert.strictEqual(frame.body, '')
    })

    it('should be tolerant of whitespace before the frame command', function () {
      const buffer = Buffer.from('  CONNECT\x0D\x0A\x0D\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'CONNECT')
      assert.deepStrictEqual(frame.headers, {})
      assert.strictEqual(frame.body, '')
    })

    it('should generate a frame correctly', function () {
      const frame = new StompFrame('CONNECT')
      assert.strictEqual(frame.toBuffer().toString(), 'CONNECT\x0A\x0A\x00')
    })
  })

  describe('SUBSCRIBE frame', function () {
    it('should parse the frame correctly', function () {
      const buffer = Buffer.from('SUBSCRIBE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0Aack:auto\x0A\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })

    it('should parse the frame with CR LF correctly', function () {
      const buffer = Buffer.from('SUBSCRIBE\x0D\x0Adestination:/topic/fm/ce1/c201/09880/text\x0D\x0Aack:auto\x0D\x0A\x0D\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })

    it('should parse a header with a space after the colon', function () {
      const buffer = Buffer.from('SUBSCRIBE\x0Adestination: /topic/fm/ce1/c201/09880/text\x0Aack : auto\x0A\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })

    it('should generate a frame correctly', function () {
      const frame = new StompFrame('SUBSCRIBE', { destination: '/topic/fm/ce1/c201/09880/text', ack: 'auto' })
      assert.strictEqual(frame.toBuffer().toString(), 'SUBSCRIBE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0Aack:auto\x0A\x0A\x00')
    })

    it('should parse a wildcard subscription correctly', function () {
      const buffer = Buffer.from('SUBSCRIBE\x0Adestination:/topic/*/text\x0Aack:auto\x0A\x0A\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'SUBSCRIBE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/*/text', ack: 'auto' })
      assert.strictEqual(frame.body, '')
    })
  })

  describe('MESSAGE frame', function () {
    it('should parse the frame correctly', function () {
      const buffer = Buffer.from('MESSAGE\x0Adestination:/topic/fm/ce1/c201/09880/text\x0A\x0AHello World\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'MESSAGE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text' })
      assert.strictEqual(frame.body, 'Hello World')
    })

    it('should parse the frame with CR LF correctly', function () {
      const buffer = Buffer.from('MESSAGE\x0D\x0Adestination:/topic/fm/ce1/c201/09880/text\x0D\x0A\x0D\x0AHello World\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame.command, 'MESSAGE')
      assert.deepStrictEqual(frame.headers, { destination: '/topic/fm/ce1/c201/09880/text' })
      assert.strictEqual(frame.body, 'Hello World')
    })

    it('should generate a frame correctly', function () {
      const frame = new StompFrame(
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
      const buffer = Buffer.from('Foo Bar\x00')
      const frame = StompFrame.parse(buffer)
      assert.strictEqual(frame, undefined)
    })
  })
})
