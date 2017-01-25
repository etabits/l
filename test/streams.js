'use strict';
import test from 'ava';

const crypto = require('crypto');
const fs = require('fs');

const Line = require('../src/Line');

const fname = require('path').join(__dirname, './streams.js')

test('as first argument, followed by non-stream', t => {
  t.plan(1);
  const l = new Line([
    (contents)=> contents.toString(),
  ]);
  return l.execute(fs.createReadStream(fname, {start: 0, end: 13})).then(function (result) {
    t.is(result, "'use strict';\n");
  })
});

test('as first argument, followed by a stream', t => {
  t.plan(1);
  const l = new Line([
    {
      stream: ()=> crypto.createHash('sha1')
    },
  ]);
  return l.execute(fs.createReadStream(fname, {start: 0, end: 13})).then(function (result) {
    t.is(result.toString('hex'), 'c84db234afc178eb3ef393b8a7aacc598131eb09');
  })
});

test('as returned from first call, followed by non-stream', t => {
  t.plan(1);
  const l = new Line([
    (v, done)=> done(null, fs.createReadStream(fname, {start: 0, end: 13})),
    (contents)=>contents.toString(),
  ]);
  return l.execute().then(function (result) {
    t.is(result, "'use strict';\n");
  })
});

test('as returned from first call, followed by a stream', t => {
  t.plan(1);
  const l = new Line([
    ()=> Promise.resolve(fs.createReadStream(fname, {start: 0, end: 13})),
    {
      stream: ()=> crypto.createHash('sha1')
    },
  ]);
  return l.execute().then(function (result) {
    t.is(result.toString('hex'), 'c84db234afc178eb3ef393b8a7aacc598131eb09');
  })
});

test('as returned from first call, followed by nothing', t => {
  t.plan(1);
  const l = new Line([
    ()=> Promise.resolve(fs.createReadStream(fname, {start: 0, end: 13})),
  ]);
  return l.execute().then(function (result) {
    t.is(result.toString(), "'use strict';\n");
  })
});
