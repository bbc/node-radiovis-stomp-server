'use strict'

const assert = require('assert')
const sinon = require('sinon')
const net = require('net')
const StompConnection = require('../../lib/stomp/connection')
const StompFrame = require('../../lib/stomp/frame')

let server
let socket
beforeEach(function () {
  // FIXME: better way of mocking this?
  server = {
    topicMap: {},
    connections: [],
    addSubscription: function (conn, topicId, type) {},
    removeSubscription: function (conn, topicId, type) {},
    removeConnection: function (conn) {}
  }
  socket = new net.Socket()
})

describe('StompConnection', function () {
  it('should create a new connection successfully', function () {
    const connection = new StompConnection(socket, server)
    assert(connection.connected)
    connection.handleDisconnect()
  })

  describe('receiving data', function () {
    let stubFrame
    let stubError
    let connection
    beforeEach(function () {
      connection = new StompConnection(socket, server)
      stubFrame = sinon.stub(connection, 'handleFrame')
      stubError = sinon.stub(connection, 'sendError')
    })
    afterEach(function () {
      connection.handleDisconnect()
    })

    it('should not call handleFrame an incomplete frame', function () {
      connection.handleData(
        Buffer.from('CONNECT')
      )
      assert(stubFrame.notCalled)
    })

    it('should call handleFrame once for a single complete frame', function () {
      connection.handleData(
        Buffer.from('CONNECT\n\n\0')
      )
      assert.strictEqual(stubFrame.callCount, 1)
      assert.strictEqual(stubError.callCount, 0)

      const connectFrame = new StompFrame('CONNECT')
      assert.deepStrictEqual(stubFrame.args[0][0], connectFrame)
    })

    it('should call handleFrame twice for two frames in a single buffer', function () {
      connection.handleData(
        Buffer.from('CONNECT\n\n\0SUBSCRIBE\ndestination:foo\n\n\0')
      )
      assert.strictEqual(stubFrame.callCount, 2)
      assert.strictEqual(stubError.callCount, 0)
      assert.strictEqual(stubFrame.args[0][0].command, 'CONNECT')
      assert.strictEqual(stubFrame.args[1][0].command, 'SUBSCRIBE')
    })

    it('should call handleFrame once for a frame split over two buffers', function () {
      connection.handleData(
        Buffer.from('SUBSCRIBE\n')
      )
      connection.handleData(
        Buffer.from('destination:foo\n\n\0')
      )

      assert.strictEqual(stubFrame.callCount, 1)
      assert.strictEqual(stubError.callCount, 0)
      assert.strictEqual(stubFrame.args[0][0].command, 'SUBSCRIBE')
      assert.strictEqual(stubFrame.args[0][0].headers.destination, 'foo')
    })

    it('should call handleFrame two for 2 frame split over two buffers', function () {
      connection.handleData(
        Buffer.from('CONNECT\n\n\0SUBSCRIBE\n')
      )
      connection.handleData(
        Buffer.from('destination:foo\n\n\0')
      )

      assert.strictEqual(stubFrame.callCount, 2)
      assert.strictEqual(stubError.callCount, 0)
      assert.strictEqual(stubFrame.args[0][0].command, 'CONNECT')
      assert.strictEqual(stubFrame.args[1][0].command, 'SUBSCRIBE')
    })

    it('should send an error if too much data is recieved', function () {
      connection.handleData(
        Buffer.alloc(1024 * 1024)
      )

      assert.strictEqual(stubFrame.callCount, 0)
      assert.strictEqual(stubError.args[0][0], 'Client sent too much data')
    })

    it('should send an error if a bad frame is recieved', function () {
      connection.handleData(
        Buffer.from('foobar\0')
      )

      assert.strictEqual(stubFrame.callCount, 0)
      assert.strictEqual(stubError.args[0][0], 'Unable to parse STOMP frame')
    })
  })
})
