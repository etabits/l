'use strict';

class MixedPipe {

  constructor(segments) {
    this.segments = segments;
  }

  execute(value) {
    this.log('executing on', value)
    this.next(0, value)
  }

  next (step, value) {
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
        self.next(streamsEnd, buf);
      })
      firstStream.write(value);
      firstStream.end();
    } else {
      var ret = segment(value, function(err, newValue) {
        self.log('\tasync ret', newValue);
        self.next(step+1, newValue);
      });
      // console.log(self.step, ret)
      if ('undefined'==typeof ret) {
        // it was async, do nothing!
      } else if (ret instanceof Promise) {
        ret.then(function(newValue) {
          self.log('\tpromise ret', newValue)
          self.next(step+1, newValue);
        });
      } else {
        self.log('\tdirect result', ret)
        self.next(step+1, ret);
      }
    }
  }

  log() {}
}

module.exports = MixedPipe;
