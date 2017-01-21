'use strict';

class MixedPipe {

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
      var firstStream = segment.stream();
      var lastStream = firstStream;
      for (var streamsEnd = step + 1;
        this.segments[streamsEnd] && this.segments[streamsEnd].stream;
        ++streamsEnd) {
        var streamStep = this.segments[streamsEnd];
        var anotherStream = streamStep.stream();
        lastStream.pipe(anotherStream)
        lastStream = anotherStream;
        self.log('found another stream at ', streamsEnd, 'name', streamStep.name)
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
      var ret = segment.call(ctxt, value, function(err, newValue) {
        self.log('\tasync ret', newValue);
        self.next(step+1, newValue, ctxt, cb);
      });
      if ('undefined'==typeof ret) {
        // it was async, do nothing!
      } else if (ret instanceof Promise) {
        ret.then(function(newValue) {
          self.log('\tpromise ret', newValue)
          self.next(step+1, newValue, ctxt, cb);
        });
      } else {
        self.log('\tdirect result', ret)
        self.next(step+1, ret, ctxt, cb);
      }
    }
  }

  log() {}
}

module.exports = MixedPipe;
