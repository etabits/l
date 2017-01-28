'use strict'
import test from 'ava'

const CONSTANTS = require('./_constants')

const crypto = require('crypto')
const fs = require('fs')

const Line = require('../src/Line')

test('split into multiple streams and a non-stream', t => {
  t.plan(1)
  const l = new Line([
    () => Promise.resolve(fs.createReadStream(CONSTANTS.FNAME, CONSTANTS.CUT)),
    {
      sha1sum: {stream: () => crypto.createHash('sha1')},
      md5sum: {stream: () => crypto.createHash('md5')},
      str: (buf) => buf.toString(),
      length: (buf) => buf.length
    }
  ])
  return l.execute().then(function (result) {
    t.deepEqual(result, {
      sha1sum: Buffer.from(CONSTANTS.SHA1, 'hex'),
      md5sum: Buffer.from(CONSTANTS.MD5, 'hex'),
      // md5sum: CONSTANTS.MD5,
      str: CONSTANTS.STR,
      length: CONSTANTS.STR.length
    })
  })
})

test('split into multiple streams and a non-stream and rejoin', t => {
  t.plan(1)
  const l = new Line([
    () => Promise.resolve(fs.createReadStream(CONSTANTS.FNAME, CONSTANTS.CUT)),
    {
      sha1sum: {stream: () => crypto.createHash('sha1')},
      md5sum: {stream: () => crypto.createHash('md5')},
      str: (buf) => buf.toString(),
      length: (buf) => buf.length
    },
    (obj) => Buffer.concat([obj.md5sum, obj.sha1sum, Buffer.from(obj.str)])
  ])
  return l.execute().then(function (result) {
    var buf = Buffer.concat([
      Buffer.from(CONSTANTS.MD5, 'hex'),
      Buffer.from(CONSTANTS.SHA1, 'hex'),
      Buffer.from(CONSTANTS.STR)
    ])
    t.deepEqual(result, buf)
  })
})