const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Lexing Badness';

const pk = pkWithDoc('../test_data/usfm/backslash.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/unknown.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Bare Backslash (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = `{ documents { mainSequence { blocks { items { type subType payload } } } } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const firstItem = result.data.documents[0].mainSequence.blocks[0].items[0];
      t.equal(firstItem.subType, 'bareSlash');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Handle exotic symbols (not really ${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = `{ documents { mainSequence { blocks { items { type subType payload } } } } }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const firstItem = result.data.documents[0].mainSequence.blocks[0].items[0];
      t.equal(firstItem.subType, 'punctuation');
      const secondItem = result.data.documents[0].mainSequence.blocks[0].items[1];
      t.equal(secondItem.subType, 'punctuation');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Bad Element in USX (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      t.throws(() => pkWithDoc('../test_data/usx/bad_element.usx', {
        lang: 'fra',
        abbr: 'hello',
      }), /Unexpected .+bananas/);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `No mt (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      t.throws(() => pkWithDoc('../test_data/usfm/no_mt.usfm', {
        lang: 'fra',
        abbr: 'hello',
      }), /wordLike content/);
    } catch (err) {
      console.log(err);
    }
  },
);
