'use strict'
const line = require('../')

var l = line([
  (val) => val * 2, // sync
  (val) => Promise.resolve(val * 3), // promise
  (val, done) => process.nextTick(() => done(null, val * 7)) // async
])

l(1, function (error, answer) { // with a callback
  if (error) {
    console.log(error)
  }
  require('assert').strictEqual(answer, 42)
})

l(Math.E).then(result => { // as a promise
  console.log(result) // 114.1678367952799
})

