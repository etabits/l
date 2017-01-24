# node-line
Mix Async/Sync code with Promises and streams in a reusable unified line

[![Build Status](https://travis-ci.org/etabits/node-line.svg?branch=master)](https://travis-ci.org/etabits/node-line)
[![Coverage Status](https://coveralls.io/repos/github/etabits/node-line/badge.svg?branch=master)](https://coveralls.io/github/etabits/node-line?branch=master)

## Installation
```sh
npm install --save https://github.com/etabits/node-line
```

## Usage Example
```js
const Line = require('line');

var l = new Line([
  (val)=> val*2, // sync
  (val)=> Promise.resolve(val*3), // promise
  (val, done)=> process.nextTick(()=>done(null, val*7)), //async
]);

l.execute(1, function(err, answer) { // with a callback
  require('assert').strictEqual(answer, 42);
});

l.execute(Math.E).then(result=> { // as a promise
  console.log(result); // 114.1678367952799
});
```
For a more complete example that involves streams, please check [examples](https://github.com/etabits/node-line/tree/master/examples) and [tests](https://github.com/etabits/node-line/tree/master/test).
