# node-line
> Mix Async/Sync code with Promises and Streams in a reusable unified line

[![Build Status](https://travis-ci.org/etabits/node-line.svg?branch=master)](https://travis-ci.org/etabits/node-line)
[![Coverage Status](https://coveralls.io/repos/github/etabits/node-line/badge.svg?branch=master)](https://coveralls.io/github/etabits/node-line?branch=master)

You have multiple functions, some of them are **async**, others are **promise**-based, and you have some **stream** transformers, and you want to plug everything together: This module **takes an array of functions/streams and gives you a single function**, that can be used with callback, or as a promise. It takes care of piping consecutive streams, buffering them before passing them to the next function... etc.

## Installation
```sh
npm install --save https://github.com/etabits/node-line
```

## Features
* A segment can be sync, async with a callback, can return a promise, or can define a stream
* Consecutive streams are automatically piped, only buffered when next segment is not a stream
* You can return a stream, and it will be automatically buffered/piped

## Usage Example
```js
const line = require('line');

var l = line([
  (val) => val * 2, // sync
  (val) => Promise.resolve(val * 3), // promise
  (val, done) => process.nextTick(() => done(null, val * 7)) // async
])

l(1, function (error, answer) { // with a callback
  require('assert').strictEqual(answer, 42)
})

l(Math.E).then(result => { // as a promise
  console.log(result) // 114.1678367952799
})
```
For a more complete example that involves streams, please check [examples](https://github.com/etabits/node-line/tree/master/examples) and [tests](https://github.com/etabits/node-line/tree/master/test).
### Alternative Method (Using objects)
```js
const Line = require('line').Line

var l = new Line([
  (val) => val * 2, // sync
  (val) => Promise.resolve(val * 3), // promise
  (val, done) => process.nextTick(() => done(null, val * 7)) // async
])

l.execute(1, function (error, answer) { // with a callback
  require('assert').strictEqual(answer, 42)
})

l.execute(Math.E).then(result => { // as a promise
  console.log(result) // 114.1678367952799
})
```


## Debugging
To enable debugging:
```sh
DEBUG=line node ./examples/npm-module-github-stats.js penguin
```
<!--- I mark it as ruby because colors look nice -->
```ruby
>executing on: penguin (5 segments)
   0 <async IncomingMessage {   _readableState: [Object],   readable: true,...
   1 @consuming readable stream...
   1 <sync { _id: 'penguin',   _rev: '151-868f4a334cf6a0bc8ced2f4485e7da78',   name: 'penguin',...
   2 <promise etabits/node-penguin
   3 <async IncomingMessage {   _readableState: [Object],   readable: true,...
   4 @consuming readable stream...
   4 <sync { gh: [Object],   npm: [Object] }...
<finished with { gh: [Object],   npm: [Object] }...
```

## Running tests
```sh
npm test
```

## Compatibility
* Line is compatible with [Node.js v6 LTS](https://nodejs.org/en/download/), [Node.js v7 Current](https://nodejs.org/en/download/current/), Node.js v5 and Node.js v4

## Next (Roadmap)
* Ability to split and rejoin a stream (parallel execution)
* Return a readable stream when last element is a stream (optional)
* Syntactic sugar, once uses cases are established, so we have a stable API
* Browser use?
* ...
