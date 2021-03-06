const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'CV Indexes';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `cvIndexes (${testGroup})`,
  async function (t) {
    try {
      const query =
        '{ documents { cvIndexes { chapter verses { verse { startBlock startItem endBlock endItem } } } mainSequence { blocks { items { ... on Token { subType chars }... on Scope { itemType label }... on Graft { subType sequenceId } } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data.documents[0].cvIndexes, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvIndex (${testGroup})`,
  async function (t) {
    try {
      const query =
        '{ documents { cvIndex(chapter:3) { chapter verses { verse { startBlock startItem endBlock endItem } } } mainSequence { blocks { items { ... on Token { subType chars }... on Scope { itemType label }... on Graft { subType sequenceId } } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data.documents[0].cvIndex, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);
