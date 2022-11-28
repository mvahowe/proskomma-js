const test = require('tape');

const pkExports = require('../../dist');

const testGroup = 'Export lexingRegexes';

test(
  `Smoke (${testGroup})`,
  function (t) {
    try {
      t.plan(3);
      t.ok('Proskomma' in pkExports);
      t.ok('lexingRegexes' in pkExports);
      t.equal(pkExports.lexingRegexes.filter(r => r[0] === 'chapter').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);
