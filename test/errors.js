'use strict';
import test from 'ava';
const crypto = require('crypto');

var Line = require('../src/Line');

var l = new Line([
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
  function ctxt(val) {
    this.final = val;
    return this;
  },
]);
test('promise rejection', t => {
  t.plan(1);
  const l = new Line([
    (val)=> val*3,
    (val)=> val*2,
    (val)=> Promise.reject(val*7)
  ]);
  return l.execute(1).catch((reason)=> {
    t.deepEqual(reason, {
      step: 2,
      value: 6,
      error: 42,
      ctxt: {},
    });
  })
});

test('catchable error', t => {
  t.plan(4);
  const l = new Line([
    (val)=> val*3,
    ()=> callNonExistentFunction(),
  ]);
  return l.execute(1).catch((reason)=> {
    t.is(reason.step, 1);
    t.is(reason.value, 3);
    t.deepEqual(reason.ctxt, {});
    t.true(reason.error instanceof ReferenceError)
  })
});

test('async error', t => {
  t.plan(4);
  const l = new Line([
    function (val, done) {
      this.value1 = val;
      setTimeout(function() {
        return done('Async Error');
      }, 1);
    },
  ]);
  return l.execute(19).catch((reason)=> {
    t.is(reason.step, 0);
    t.is(reason.value, 19);
    t.deepEqual(reason.ctxt, {value1: 19});
    t.is(reason.error, 'Async Error');
  })
});
