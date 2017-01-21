'use strict';

class MixedPipe {

  constructor(segments) {
    this.segments = segments;
  }

  execute(value, ctxt) {
    this.log('executing on', value)
    this.next(0, value, ctxt || {})
  }

  next (step, value, ctxt) {
    var self = this;
    var segment = this.segments[step];
    if (!segment) {
      self.log('finished!', value);
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
        self.next(streamsEnd, buf, ctxt);
      })
      firstStream.write(value);
      firstStream.end();
    } else {
      var ret = segment.call(ctxt, value, function(err, newValue) {
        self.log('\tasync ret', newValue);
        self.next(step+1, newValue, ctxt);
      });
      if ('undefined'==typeof ret) {
        // it was async, do nothing!
      } else if (ret instanceof Promise) {
        ret.then(function(newValue) {
          self.log('\tpromise ret', newValue)
          self.next(step+1, newValue, ctxt);
        });
      } else {
        self.log('\tdirect result', ret)
        self.next(step+1, ret, ctxt);
      }
    }
  }

  log() {}
}

module.exports = MixedPipe;
