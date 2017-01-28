'use strict'
var utilities = {}

utilities.bufferStream = function (stream) {
  return new Promise(function (resolve, reject) {
    var buf
    stream.on('data', function (data) {
      if (!buf) {
        buf = Buffer.from(data)
      } else {
        buf = Buffer.concat([buf, data])
      }
    })
    stream.on('end', function () {
      resolve(buf)
    })
    stream.on('error', reject)
  })
}
utilities.segmentType = function (segment) {
  if (segment.$type) return segment.$type
  // TODO infer from function name(){}
  for (var type of ['stream', 'sync', 'async', 'promise']) {
    if (typeof segment[type] !== 'undefined') return type
  }
  return 'auto'
}
utilities.expandSegment = function (segment) {
  if (typeof segment === 'function') {
    segment = {
      func: segment
    }
  }
  segment.$type = utilities.segmentType(segment)
  return segment
}
module.exports = utilities
