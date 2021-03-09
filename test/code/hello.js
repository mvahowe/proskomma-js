const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Hello USFM';

const pk = pkWithDoc('../test_data/usfm/hello.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Headers (${testGroup})`,
  async function (t) {
    try {
      const expectedHeaders = [
        ['bookCode', 'MRK'],
        ['id', 'MRK Mark\'s Gospel, translated by Mark'],
        ['toc', 'The Gospel of Mark'],
        ['toc2', 'Mark'],
        ['toc3', 'Mk'],
      ];
      t.plan(6 + (2 * expectedHeaders.length));
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
      const query2 = '{documents { toc: header(id:"toc") toc3: header(id:"toc3") banana: header(id:"banana")} }';
      const result2 = await pk.gqlQuery(query2);
      t.ok('data' in result2);
      t.equal(result2.data.documents[0].toc, 'The Gospel of Mark');
      t.equal(result2.data.documents[0].toc3, 'Mk');
      t.equal(result2.data.documents[0].banana, null);
    } catch (err) {
      console.log(err);
    }
  },
);
test(
  `One-Block Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query =
        '{ documents { sequences { type blocks { bs { payload } text } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = result.data.documents[0].sequences;
      t.equal(sequences.length, 1);
      t.equal(sequences[0].type, 'main');
      t.equal(sequences[0].blocks.length, 1);
      t.equal(sequences[0].blocks[0].bs.payload, 'blockTag/p');
      const expectedText = 'This is how the Good News of JC began...';
      t.equal(sequences[0].blocks[0].text, expectedText);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `One Chapter and Verse (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query =
        '{ documents { sequences { type blocks { os { payload } is { payload } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].sequences[0].blocks[0];
      t.equal(block.os.length, 0);
      t.equal(block.is.length, 3);
      t.equal(block.is[0].payload, 'chapter/1');
      t.equal(block.is[1].payload, 'verse/1');
      t.equal(block.is[2].payload, 'verses/1');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Query callback (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      let callbackValue = 2;
      const callback = () => callbackValue++;
      const query =
        '{ nDocuments }';
      await pk.gqlQuery(query, callback);
      t.equal(callbackValue, 3);
    } catch (err) {
      console.log(err);
    }
  },
);