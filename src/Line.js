'use strict';

class Line {

  constructor(segments) {
    this.segments = segments;
  }

  execute(value, ctxt, cb) {
    this.log('executing on', value)
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
    if (!segment) {
      self.log('finished!', value);
      cb(null, value)
      return;
    }
    self.log(step, segment.name || 'anon', value);
    if (segment.stream) {
      var firstStream, lastStream;
      for (var streamsEnd = step;
        this.segments[streamsEnd] && this.segments[streamsEnd].stream;
        ++streamsEnd) {
        var streamSegment = this.segments[streamsEnd];
        var currentStream = streamSegment.stream();
        if (!firstStream) {
          firstStream = currentStream;
        } else {
          lastStream.pipe(currentStream);
          self.log('found another stream at', streamsEnd, 'name=', streamSegment.name)
        }
        lastStream = currentStream;
      }

      var buf;
      lastStream.on('data', function(data) {
        if (!buf) {
          buf = Buffer.from(data);
        } else {
          buf = Buffer.concat([buf, data]);
        }
      })
      lastStream.on('end', function() {
        self.log('\tstream end', buf.toString('hex'));
        self.next(streamsEnd, buf, ctxt, cb);
      })
      firstStream.write(value);
      firstStream.end();
    } else {
      var ret;
      var asyncCallback = function(error, newValue) {
        if (error) {
          return cb({error, step, value, ctxt});
        }
        self.log('\tasync ret', newValue);
        self.next(step+1, newValue, ctxt, cb);
      }
      try {
        ret = segment.call(ctxt, value, asyncCallback);
      } catch (error) {
        return cb({error, step, value, ctxt});
      }
      if ('undefined'==typeof ret) {
        // it was async, do nothing!
      } else if (ret instanceof Promise) {
        ret.then(function(newValue) {
          self.log('\tpromise ret', newValue)
          self.next(step+1, newValue, ctxt, cb);
        }).catch(function(error) {
          return cb({error, step, value, ctxt});
        })
      } else {
        self.log('\tdirect result', ret)
        self.next(step+1, ret, ctxt, cb);
      }
    }
  }

  log() {}
}

module.exports = Line;