'use strict'

var assert = require('assert')
var RadioVisServer = require('../lib/radiovis-server')
var RadioVisService = require('../lib/radiovis-service')

describe('RadioVisServer', function () {
  describe('initialising', function () {
    it('should fall back to default settings', function () {
      var serviceData = {
        london: {
          name: 'BBC Radio London',
          bearers: ['dab:ce1.c186.cc31.0']
        }
      }

      var server = new RadioVisServer({}, serviceData)
      assert.strictEqual(server.stompPort, 61613)
      assert.strictEqual(server.stompHost, '0.0.0.0')
      assert.strictEqual(server.adminPort, 3000)
      assert.strictEqual(server.adminHost, '127.0.0.1')
      assert.strictEqual(typeof server.services, 'object')
      assert(server.services.london instanceof RadioVisService)
      assert.deepStrictEqual(server.connections, [])
      assert.deepStrictEqual(server.topicMap, {
        'dab/ce1/c186/cc31/0': {
          serviceId: 'london',
          subscribers: {
            image: [],
            text: []
          }
        }
      })
    })
  })
})
