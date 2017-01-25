'use strict'
const stream = require('stream')

const utilities = require('./utilities')

class Line {

  constructor (segments) {
    this.segments = segments.map(utilities.expandSegment)
  }

  execute (value, ctxt, cb) {
    if (typeof ctxt === 'function') {
      cb = ctxt
      ctxt = {}
    }
    this.log('>executing on:', value, `(${this.segments.length} segments)`)
    var p
    if (!cb) {
      var rs, rj
      cb = function (err, result) {
        if (err) {
          rj(err)
        } else {
          rs(result)
        }
      }
      p = new Promise(function (resolve, reject) {
        rs = resolve
        rj = reject
      })
    }
    this.next(0, value, ctxt || {}, cb)

    return p
  }

  next (step, value, ctxt, cb) {
    var self = this
    var segment = this.segments[step]
    var isReadableStream = value instanceof stream.Readable

    if (segment && segment.type === 'stream') {
      var s = segment.stream()
      if (isReadableStream) {
        self.log('  ', step, '|piping to stream...')
        value.pipe(s)
      } else {
        self.log('  ', step, '!writing to stream...')
        s.write(value)
        s.end()
      }
      self.next(step + 1, s, ctxt, cb)
    } else if (isReadableStream) {
      self.log('  ', step, '@consuming readable stream...')
      utilities.bufferStream(value, function (error, buf) {
        if (error) {
          // FIXME write a test and correctly handle this (streams may err but continue to work?)
        }
        self.next(step, buf, ctxt, cb)
      })
    } else if (segment) {
      Line.resolveSegment(segment, value, ctxt, function (error, newValue, inferredType) {
        if (error) {
          return cb({error, step, value, ctxt})
        }
        self.log('  ', step, `<${inferredType}`, newValue)
        self.next(step + 1, newValue, ctxt, cb)
      })
    } else {
      self.log('<finished with', value)
      cb(null, value)
    }
  }

  static resolveSegment (segment, value, ctxt, done) {
    var ret
    var asyncCallback
    if (segment.type === 'async' || segment.type === 'auto') {
      asyncCallback = (error, value) => done(error, value, 'async')
    }
    try {
      ret = segment.func.call(ctxt, value, asyncCallback)
    } catch (error) {
      return done(error)
    }
    if ((typeof ret === 'undefined' && segment.type === 'auto') || segment.type === 'async') {
      // it was async, do nothing!
    } else if (ret instanceof Promise) {
      ret
      .then((newValue) => done(null, newValue, 'promise'))
      .catch((error) => done(error))
    } else {
      done(null, ret, 'sync')
    }
  }

  log () {}
}

module.exports = Line;

/* jshint ignore:start */
((/^line(:|$)/).test(process.env.DEBUG)) && require('./debug')
/* jshint ignore:end */
