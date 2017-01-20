'use strict';
const crypto = require('crypto');

var MixedPipe = require('../src/MixedPipe');

var pe = new MixedPipe([
  (val)=> val*2,
  (val)=> Promise.resolve(val*3),
  function add4(val, done) {
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
]);
pe.debug = true;
pe.execute(5)
