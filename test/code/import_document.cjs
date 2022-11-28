const test = require('tape');

const { Proskomma } = require('../../dist');

const testGroup = 'Document';

test(
  `Unknown Content Format (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      const pk = new Proskomma();

      t.throws(() => pk.importDocument({
        lang: 'deu',
        abbr: 'xyz',
      }, 'mov', 'abc', {}));
    } catch (err) {
      console.log(err);
    }
  },
);