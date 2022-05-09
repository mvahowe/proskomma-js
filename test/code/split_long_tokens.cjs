const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Split Long Tokens';

const pk = pkWithDoc('../test_data/usfm/split_long_tokens.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `300-Char Word (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query = `{ documents { mainSequence { blocks { items {type subType payload} } } } }`;
      const result = await pk.gqlQuery(query);
      t.ok('data' in result);
      const words = result.data.documents[0].mainSequence.blocks[0].items.filter(i => i.subType === 'wordLike');
      t.equal(words.length, 4);
      t.equal(words[0].payload.length, 127);
      t.equal(words[1].payload.length, 127);
      t.equal(words[2].payload.length, 46);
      t.equal(words[3].payload.length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);