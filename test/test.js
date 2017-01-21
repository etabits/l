'use strict';
const crypto = require('crypto');

var MixedPipe = require('../src/MixedPipe');
MixedPipe.prototype.log = function() {
  console.log.apply(console,arguments)
}

var pe = new MixedPipe([
  (val)=> val*2,
  (val)=> Promise.resolve(val*3),
  function add4(val, done) {
    this.testContext = `HI! ${val}`;
    setTimeout(function() {
      done(null, val+4)
    },1)
  },
  (val)=>'' + val,
  {
    stream: ()=>crypto.createHash('sha1')
  },
  {
    stream: ()=>crypto.createHash('md5')
  },
  (val)=>val.toString('base64'),
  function ctxtPrinter(val) {
    console.log('E>', this)
    return val;
  },
]);
pe.execute(5)
.then(function (result) {
  console.log('Promise then:', result)
})
pe.execute(6, {preset: 'CONTEXT'}, function(err, result) {
  console.log('Async callback:', err, result)
})
