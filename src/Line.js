'use strict';
const stream = require('stream');

const utilities = require('./utilities')

class Line {

  constructor(segments) {
    this.segments = segments.map(utilities.expandSegment);
  }

  execute(value, ctxt, cb) {
    if ('function'==typeof ctxt) {
      cb = ctxt;
      ctxt = {};
    }
    this.log('>executing on:', value, `(${this.segments.length} segments)`)
    var p;
    if (!cb) {
      var resolve, reject;
      cb = function(err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
      p = new Promise(function(rs, rj){
        resolve = rs;
        reject = rj;
      });
    }
    this.next(0, value, ctxt || {}, cb)

    return p;
  }

  next (step, value, ctxt, cb) {
    var self = this;
    var segment = this.segments[step];
    var isReadableStream = value instanceof stream.Readable;

    if (segment && 'stream'==segment.type) {
      var s = segment.stream();
      if (isReadableStream) {
        self.log('  ', step, '|piping to stream...')
        value.pipe(s)
      } else {
        self.log('  ', step, '!writing to stream...')
        s.write(value);
        s.end();
      }
      self.next(step+1, s, ctxt, cb);
    } else if (isReadableStream) {
      self.log('  ', step, '@consuming readable stream...')
      utilities.bufferStream(value, function(err, buf) {
        self.next(step, buf, ctxt, cb);
      })
    } else if (segment) {
      Line.resolveSegment(segment, value, ctxt, function(error, newValue, inferredType) {
        if (error) {
          return cb({error, step, value, ctxt});
        }
        self.log('  ', step, `<${inferredType}`, newValue)
        self.next(step+1, newValue, ctxt, cb);
      })
    } else {
      self.log('<finished with', value);
      cb(null, value)
    }
  }

  static resolveSegment(segment, value, ctxt, done) {
    var ret;
    var asyncCallback;
    if ('async'==segment.type || 'auto'==segment.type) {
      asyncCallback = (error, value)=> done(error, value, 'async');
    }
    try {
      ret = segment.func.call(ctxt, value, asyncCallback);
    } catch (error) {
      return done(error);
    }
    if (('undefined'==typeof ret && 'auto'==segment.type) || 'async'==segment.type) {
      // it was async, do nothing!
    } else if (ret instanceof Promise) {
      ret
      .then((newValue)=>done(null, newValue, 'promise'))
      .catch((error)=> done(error))
    } else {
      done(null, ret, 'sync');
    }
  }

  log() {}
}

module.exports = Line;

