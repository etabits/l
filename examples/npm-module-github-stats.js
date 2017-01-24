'use strict';
// Usage: node examples/npm-module-github-stats.js [packages...]
// Example: node examples/npm-module-github-stats.js express penguin mongoose
const https = require('https');

const Line = require('../');

var l = new Line([
  // Request package info from npmjs (async, returns a readable stream)
  function (pkg, done) {
    https.get(`https://registry.npmjs.com/${pkg}`, (res)=>done(null, res))
  },
  // Convert to JSON (sync)
  (str)=> JSON.parse(str),
  // passes on the github repo, or throws an error (return a promise)
  function(npmData) {
    this.npm = npmData; // save to shared context
    var m = npmData.repository.url.match(/:\/\/github.com\/([^/]+\/[^/]+)/i);
    if (!m) {
      return Promise.reject('Could not find a github url!');
    }
    return Promise.resolve(m[1].replace(/\.git$/i, ''));
  },
  // Read data from github
  function(gitHubRepo, done) {
    https.get({
      host: 'api.github.com',
      path: `/repos/${gitHubRepo}`,
      headers: { 'User-Agent': 'Node.js line' },
    }, (res)=>done(null, res))
  },
  // Sum up!
  function(githubJSON) {
    return {
      gh: JSON.parse(githubJSON),
      npm: this.npm, // restore from shared context
    }
  }
]);

var packages = process.argv.slice(2)
if (!packages.length) {
  packages = ['express', 'gulp', 'request'];
}
for (let pkg of packages) {
  l.execute(pkg)
  .then(function (info) {
    console.log(`Package [${info.npm.name}](${info.npm.homepage}): ${info.npm.description}\n`,
      `Has ${Object.keys(info.npm.users).length} users, as reported by npm\n`,
      `Has ${info.gh.stargazers_count} stargazers, ${info.gh.subscribers_count} watchers,`,
      `${info.gh.forks} forks and ${info.gh.open_issues} open issues\n`);
  })
  .catch(function (error) {
    console.log('Problem retrieving info for package', pkg)
  })
}
