const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'PT GLO';

const pk = pkWithDoc('../test_data/usx/not_nfc18_glo.usx', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Headers (${testGroup})`,
  async function (t) {
    try {
      const expectedHeaders = [
        ['bookCode', 'GLO'],
        ['id', 'GLO'],
      ];
      t.plan(2 + (2 * expectedHeaders.length));
      const query = '{ documents { headers { key value } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const queryHeaders = result.data.documents[0].headers;
      t.equal(queryHeaders.length, expectedHeaders.length);

      for (const [expectedKey, expectedValue] of expectedHeaders) {
        const queryTuple = queryHeaders.filter(kv => kv.key === expectedKey);
        t.ok(queryTuple.length === 1);
        t.ok(queryTuple[0].value === expectedValue);
      }
    } catch (err) {
      console.log(err);
    }
  },
);
