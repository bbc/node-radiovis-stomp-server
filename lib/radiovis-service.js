'use strict'

function RadioVisService (id, props) {
  this.id = id
  this.name = props.name || id
  this.bearers = props.bearers
  this.image = props.default_image
  this.link = props.default_link
  this.text = props.default_text || 'You are listening to ' + this.name
}

RadioVisService.initServices = function (serviceData) {
  var services = {}
  for (var serviceId in serviceData) {
    services[serviceId] = new RadioVisService(
      serviceId, serviceData[serviceId]
    )
  }
  return services
}

RadioVisService.prototype.topics = function () {
  return this.bearers.map(function (bearerId) {
    return bearerId.replace(/\W/g, '/')
  })
}

module.exports = RadioVisService
