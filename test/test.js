'use strict';
const crypto = require('crypto');

var Line = require('../src/MixedPipe');
Line.prototype.log = function() {
  console.log.apply(console,arguments)
}

var l = new Line([
  (val)=> val*2,
  // (val)=> Promise.reject('TestRejection!'), // Uncomment to test promise errors
  (val)=> Promise.resolve(val*3),
  function add4(val, done) {
    // callNonExistentFunction(); // Uncomment to test catchable errors
    this.testContext = `HI! ${val}`;
    setTimeout(function() {
      // return done('Async Error') // Uncomment to test async errors
      done(null, val+4)
    },1)
  },
  (val)=>'' + val,
  {
    stream: ()=>crypto.createHash('sha1')
  },
  {
    name: 'md5sum',
    stream: ()=>crypto.createHash('md5')
  },
  (val)=>val.toString('base64'),
  function ctxtPrinter(val) {
    console.log('E>', this)
    return val;
  },
]);
l.execute(5)
.then(function (result) {
  console.log('Promise then:', result);
})
.catch(function (error) {
  console.log('Promise catch:', error);
})
l.execute(6, {preset: 'CONTEXT'}, function(err, result) {
  console.log('Async callback:', err, result);
})
