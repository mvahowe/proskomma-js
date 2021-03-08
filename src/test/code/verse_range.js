const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Verse Range';

const pk = pkWithDoc('../test_data/usfm/verse_range.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Verse and Verses Scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query =
        '{ documents { mainSequence { blocks { is { payload } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.is.length, 4);
      t.equal(block.is[0].payload, 'chapter/1');
      t.equal(block.is[1].payload, 'verse/1');
      t.equal(block.is[2].payload, 'verse/2');
      t.equal(block.is[3].payload, 'verses/1-2');
    } catch (err) {
      console.log(err);
    }
  },
);