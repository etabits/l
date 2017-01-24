var utilities = {};

utilities.bufferStream = function(stream, done) {
  var buf;
  stream.on('data', function(data) {
    if (!buf) {
      buf = Buffer.from(data);
    } else {
      buf = Buffer.concat([buf, data]);
    }
  })
  stream.on('end', function() {
    done(null, buf)
  })
}
utilities.segmentType = function(segment) {
  if (segment.type) return segment.type;
  for (var type of ['stream', 'sync', 'async', 'promise']) {
    if ('undefined'!=typeof segment[type]) return type;
  }
  return 'auto';
}

module.exports = utilities;
