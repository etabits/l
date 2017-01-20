'use strict';

function debug() {
  console.log.apply(console,arguments)  
}
class MixedPipe {

  constructor(pipeline) {
    this.pipeline = pipeline;
  }

  execute(value) {
    debug('executing on', value)
    this.value = value;
    this.step = 0;
    this.next()
  }

  next () {
    var step = this.pipeline[this.step];
    var self = this;
    if (!step) {
      debug('finished!', this.value)
      return;
    }
    debug(this.step, step.name, this.value)
    if ('promise'==step.type) {
      step.func(this.value)
      .then(function(newValue) {
        debug('\tpromise ret', newValue)
        self.value = newValue;
        self.step++
        self.next()
      })
    } else if ('async'==step.type) {
      step.func(this.value, function(err, newValue) {
        debug('\tasync ret', newValue)
        self.value = newValue
        self.step++;
        self.next()

      })
    } else if ('stream'==step.type) {
      var firstStream = step.func();
      var lastStream = firstStream;
      for (var streamsEnd = this.step + 1;
        this.pipeline[streamsEnd] && 'stream'==this.pipeline[streamsEnd].type;
        ++streamsEnd) {
        var streamStep = this.pipeline[streamsEnd];
        var anotherStream = streamStep.func();
        lastStream.pipe(anotherStream)
        lastStream = anotherStream;
        console.log('found another stream at ', streamsEnd, 'name', streamStep.name)
      }

      var buf;
      lastStream.on('data', function(data) {
        if (!buf) {
          buf = Buffer.from(data)
        } else {
          buf += data;
        }
      })
      lastStream.on('end', function() {
        self.value = buf;
        debug('\tstream end', self.value.toString('hex'))
        self.step+=2;
        self.next();
      })
      firstStream.write(this.value);
      firstStream.end();
    } else {
      console.error('unknown type', step.type)
    }
  }
}

module.exports = MixedPipe;
