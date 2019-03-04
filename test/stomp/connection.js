'use strict'

var assert = require('assert')
var sinon = require('sinon')
var net = require('net')
var StompConnection = require('../../lib/stomp/connection')
var StompFrame = require('../../lib/stomp/frame')

var server
var socket
beforeEach(function () {
  server = {}
  socket = new net.Socket()
})

describe('StompConnection', function () {
  it('should create a new connection successfully', function () {
    var connection = new StompConnection(socket, server)
    assert(connection.connected)
  })

  describe('receiving data', function () {
    var stubFrame
    var stubError
    var connection
    beforeEach(function () {
      connection = new StompConnection(socket, server)
      stubFrame = sinon.stub(connection, 'handleFrame')
      stubError = sinon.stub(connection, 'sendError')
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
      assert.equal(stubFrame.callCount, 1)
      assert.equal(stubError.callCount, 0)

      var connectFrame = new StompFrame('CONNECT')
      assert.deepEqual(stubFrame.args[0][0], connectFrame)
    })

    it('should call handleFrame twice for two frames in a single buffer', function () {
      connection.handleData(
        Buffer.from('CONNECT\n\n\0SUBSCRIBE\ndestination:foo\n\n\0')
      )
      assert.equal(stubFrame.callCount, 2)
      assert.equal(stubError.callCount, 0)
      assert.equal(stubFrame.args[0][0].command, 'CONNECT')
      assert.equal(stubFrame.args[1][0].command, 'SUBSCRIBE')
    })

    it('should call handleFrame once for a frame split over two buffers', function () {
      connection.handleData(
        Buffer.from('SUBSCRIBE\n')
      )
      connection.handleData(
        Buffer.from('destination:foo\n\n\0')
      )

      assert.equal(stubFrame.callCount, 1)
      assert.equal(stubError.callCount, 0)
      assert.equal(stubFrame.args[0][0].command, 'SUBSCRIBE')
      assert.equal(stubFrame.args[0][0].headers.destination, 'foo')
    })

    it('should call handleFrame two for 2 frame split over two buffers', function () {
      connection.handleData(
        Buffer.from('CONNECT\n\n\0SUBSCRIBE\n')
      )
      connection.handleData(
        Buffer.from('destination:foo\n\n\0')
      )

      assert.equal(stubFrame.callCount, 2)
      assert.equal(stubError.callCount, 0)
      assert.equal(stubFrame.args[0][0].command, 'CONNECT')
      assert.equal(stubFrame.args[1][0].command, 'SUBSCRIBE')
    })

    it('should send an error if too much data is recieved', function () {
      connection.handleData(
        Buffer.alloc(1024 * 1024)
      )

      assert.equal(stubFrame.callCount, 0)
      assert.equal(stubError.args[0][0], 'Client sent too much data')
    })

    it('should send an error if a bad frame is recieved', function () {
      connection.handleData(
        Buffer.from('foobar\0')
      )

      assert.equal(stubFrame.callCount, 0)
      assert.equal(stubError.args[0][0], 'Unable to parse STOMP frame')
    })
  })
})
