const test = require('tape');

const { Proskomma } = require('../../src');

const testGroup = 'Document';

test(
  `Unknown Content Format (${testGroup})`,
  async function (t) {
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