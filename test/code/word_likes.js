const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'wordLikes';

const pk = pkWithDoc('../test_data/usfm/cp_vp.usfm', {
  lang: 'eng',
  abbr: 'hello',
})[0];

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(8 );
      let query =
        '{ docSets { wordLikes } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let wordLikes = result.data.docSets[0].wordLikes;
      t.ok(wordLikes.includes('Here'));
      t.false(wordLikes.includes('here'));
      query =
        '{ docSets { wordLikes(coerceCase:"toLower") } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      wordLikes = result.data.docSets[0].wordLikes;
      t.ok(wordLikes.includes('here'));
      t.false(wordLikes.includes('Here'));
      query =
        '{ docSets { wordLikes(coerceCase:"toUpper") } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      wordLikes = result.data.docSets[0].wordLikes;
      t.ok(wordLikes.includes('HERE'));
    } catch (err) {
      console.log(err);
    }
  },
);
