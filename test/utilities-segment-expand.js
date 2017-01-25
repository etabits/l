'use strict'
import test from 'ava'

const utilities = require('../src/utilities')

test('utilities segment expand function', t => {
  t.plan(2)
  var _s = () => {}
  var s = utilities.expandSegment(_s)
  t.is(s.type, 'auto')
  t.is(s.func, _s)
})

test('utilities segment expand object', t => {
  t.plan(2)
  var _s = {
    type: 'stream',
    func: () => {}
  }
  var s = utilities.expandSegment(_s)
  t.is(s.type, 'stream')
  t.is(s.func, _s.func)
})
