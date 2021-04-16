const test = require('tape');

const { pkWithDocs } = require('../lib/load');

const testGroup = 'Diff';

const pk = pkWithDocs([
  ['../test_data/usx/diff1.usx', {
    lang: 'eng',
    abbr: 'web',
  }],
  ['../test_data/usx/diff2.usx', {
    lang: 'eng',
    abbr: 'web2',
  }],
]);

const docIds = Object.keys(pk.documents);

test(
  `Compare 2 documents (${testGroup})`,
  async function (t) {
    try {
      const expected = [
        ['words', 1, 1, 5, 3, 2],
        ['tokens', 1, 1, 5, 3, 4],
      ];
      t.plan(6 * expected.length);
      for (const expectation of expected) {
        const query = `
      {
         diff(
           document1: "${docIds[0]}" document2: "${docIds[1]}" mode: "%mode%"
         ) {
             chapter verse diffType text1 text2 tokensDiff wordsDiff
         }
       }`.replace('%mode%', expectation[0]);
        const result = await pk.gqlQuery(query);
        t.equal(result.errors, undefined);
        const diff = result.data.diff;
        t.equal(diff.filter(d => d.diffType === 'addedChapter').length, expectation[1]);
        t.equal(diff.filter(d => d.diffType === 'removedChapter').length, expectation[2]);
        t.equal(diff.filter(d => d.diffType === 'addedVerse').length, expectation[3]);
        t.equal(diff.filter(d => d.diffType === 'removedVerse').length, expectation[4]);
        t.equal(diff.filter(d => d.diffType === 'changedVerse').length, expectation[5]);
      }
    } catch (err) {
      console.log(err);
    }
  },
);
