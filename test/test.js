'use strict';
const crypto = require('crypto');

var MixedPipe = require('../src/MixedPipe');

var pe = new MixedPipe([
  {
    name: 'mul3',
    type: 'promise',
    func: function (value) {
      return Promise.resolve(value*3);
    }
  },
  {
    name: 'add9',
    type: 'async',
    func: function (value, done) {
      setTimeout(function() {
        done(null, value+9)
      },1)
    }
  },
  {
    name: 'toString',
    type: 'promise',
    func: function (value) {
      return Promise.resolve(''+value);
    }
  },
  {
    name: 'sha1',
    type: 'stream',
    func: ()=>crypto.createHash('sha1')
  },
  // {
  //  name: 'hexify',
  //  type: 'promise',
  //  func: (value)=>Promise.resolve(value.toString('hex'))
  // },
  {
    name: 'md5',
    type: 'stream',
    func: ()=>crypto.createHash('md5')
  },

]);
pe.execute(5)
