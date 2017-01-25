'use strict'
// do NOT touch first 2 lines
import test from 'ava'

const crypto = require('crypto')
const fs = require('fs')

const Line = require('../src/Line')

const fname = require('path').join(__dirname, './streams.js')

test('as first argument, followed by non-stream', t => {
  t.plan(1)
  const l = new Line([
    (contents) => contents.toString()
  ])
  return l.execute(fs.createReadStream(fname, {start: 0, end: 42})).then(function (result) {
    t.is(result, "'use strict'\n// do NOT touch first 2 lines\n")
  })
})

test('as first argument, followed by a stream', t => {
  t.plan(1)
  const l = new Line([
    {
      stream: () => crypto.createHash('sha1')
    }
  ])
  return l.execute(fs.createReadStream(fname, {start: 0, end: 42})).then(function (result) {
    t.is(result.toString('hex'), '67474c19ef8d88cb06c48d6888d2e0ce95f35bd3')
  })
})

test('as returned from first call, followed by non-stream', t => {
  t.plan(1)
  const l = new Line([
    (v, done) => done(null, fs.createReadStream(fname, {start: 0, end: 42})),
    (contents) => contents.toString()
  ])
  return l.execute().then(function (result) {
    t.is(result, "'use strict'\n// do NOT touch first 2 lines\n")
  })
})

test('as returned from first call, followed by a stream', t => {
  t.plan(1)
  const l = new Line([
    () => Promise.resolve(fs.createReadStream(fname, {start: 0, end: 42})),
    {
      stream: () => crypto.createHash('sha1')
    }
  ])
  return l.execute().then(function (result) {
    t.is(result.toString('hex'), '67474c19ef8d88cb06c48d6888d2e0ce95f35bd3')
  })
})

test('as returned from first call, followed by nothing', t => {
  t.plan(1)
  const l = new Line([
    () => Promise.resolve(fs.createReadStream(fname, {start: 0, end: 42}))
  ])
  return l.execute().then(function (result) {
    t.is(result.toString(), "'use strict'\n// do NOT touch first 2 lines\n")
  })
})
