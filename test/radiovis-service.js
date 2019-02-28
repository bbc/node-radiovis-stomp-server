'use strict'

var assert = require('assert')
var RadioVisService = require('../lib/radiovis-service')

describe('RadioVisService', function () {
  describe('initialising', function () {
    it('should set properties correctly, when there is only a bearer', function () {
      var serviceData = {
        'bearers': ['dab:ce1.c186.cc31.0']
      }

      var service = new RadioVisService('bbclondon', serviceData)
      assert.equal(service.name, 'bbclondon')
      assert.equal(service.image, undefined)
      assert.equal(service.link, undefined)
      assert.equal(service.text, 'You are listening to bbclondon')
      assert.deepEqual(service.bearers, ['dab:ce1.c186.cc31.0'])
    })

    it('should set properties correctly, when there is no default text', function () {
      var serviceData = {
        'name': 'BBC Radio London',
        'default_image': 'http://www.bbc.co.uk/bbclondon.png',
        'default_link': 'http://www.bbc.co.uk/bbclondon',
        'bearers': [
          'dab:ce1.c186.cc31.0',
          'fm:ce1.cc11.09490'
        ]
      }

      var service = new RadioVisService('bbclondon', serviceData)
      assert.equal(service.name, 'BBC Radio London')
      assert.equal(service.image, 'http://www.bbc.co.uk/bbclondon.png')
      assert.equal(service.link, 'http://www.bbc.co.uk/bbclondon')
      assert.equal(service.text, 'You are listening to BBC Radio London')
      assert.deepEqual(service.bearers, [
        'dab:ce1.c186.cc31.0',
        'fm:ce1.cc11.09490'
      ])
    })

    it('should set properties correctly, when there is default text', function () {
      var serviceData = {
        'name': 'Foo Bar Radio',
        'default_image': 'http://example.com/foo.png',
        'default_text': 'Hello World',
        'bearers': ['fm:ce1.c586.09580']
      }

      var service = new RadioVisService('foo', serviceData)
      assert.equal(service.name, 'Foo Bar Radio')
      assert.equal(service.image, 'http://example.com/foo.png')
      assert.equal(service.link, undefined)
      assert.equal(service.text, 'Hello World')
      assert.deepEqual(service.bearers, ['fm:ce1.c586.09580'])
    })
  })

  describe('#topics', function () {
    it('should convert a list of bearers to a list of topic names', function () {
      var serviceData = {
        'bearers': [
          'dab:ce1.c186.cc31.0',
          'fm:ce1.cc11.09490'
        ]
      }

      var service = new RadioVisService('london', serviceData)
      assert.deepEqual(service.bearers, [
        'dab:ce1.c186.cc31.0',
        'fm:ce1.cc11.09490'
      ])
      assert.deepEqual(service.topics(), [
        'dab/ce1/c186/cc31/0',
        'fm/ce1/cc11/09490'
      ])
    })
  })

  describe('initServices', function () {
    it('should load a list of services', function () {
      var serviceData = {
        'radio1': { 'name': 'BBC Radio 1', 'bearers': ['dab:ce1.ce15.c221.0'] },
        'radio2': { 'name': 'BBC Radio 2', 'bearers': ['dab:ce1.ce15.c222.0'] },
        'radio3': { 'name': 'BBC Radio 3', 'bearers': ['dab:ce1.ce15.c223.0'] }
      }

      var services = RadioVisService.initServices(serviceData)
      assert.equal(Object.keys(services).length, 3)
      assert.equal(services['radio1'].name, 'BBC Radio 1')
    })
  })
})
