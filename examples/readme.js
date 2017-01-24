'use strict';
const Line = require('../');

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

