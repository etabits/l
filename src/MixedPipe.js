'use strict';

class MixedPipe {

  constructor(segments) {
    this.segments = segments;
  }

  execute(value) {
    this.log('executing on', value)
    this.value = value;
    this.step = 0;
    this.next()
  }

  next () {
    var self = this;
    var step = this.segments[this.step];
    if (!step) {
      self.log('finished!', this.value);
      return;
    }
    self.log(this.step, step.name || 'anon', this.value);
    if (step.stream) {
      var firstStream = step.stream();
      var lastStream = firstStream;
      for (var streamsEnd = this.step + 1;
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
        self.value = buf;
        self.log('\tstream end', self.value.toString('hex'))
        self.step+=(streamsEnd-self.step);
        self.next();
      })
      firstStream.write(this.value);
      firstStream.end();
    } else {
      var ret = step(this.value, function(err, newValue) {
        self.log('\tasync ret', newValue)
        self.value = newValue
        self.step++;
        self.next();
      });
      // console.log(self.step, ret)
      if ('undefined'==typeof ret) {
        // it was async, do nothing!
      } else if (ret instanceof Promise) {
        ret.then(function(newValue) {
          self.log('\tpromise ret', newValue)
          self.value = newValue;
          self.step++;
          self.next();
        });

      } else {
        self.log('\tdirect result', ret)
        self.value = ret
        self.step++;
        self.next();

      }
    }
    return;
  }

  log() {}
}

module.exports = MixedPipe;
