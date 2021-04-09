const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'cv Navigation';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `Next/Previous Chapter (${testGroup})`,
  async function (t) {
    try {
      const expected = [
        ['2', '1', '3'],
        ['1', null, '2'],
        ['4', '3', null],
        ['5', null, null],
      ];
      t.plan(3 * expected.length);
      for (const [chap, prev, next] of expected) {
        const query =
          '{ documents { nav: cvNavigation(chapter:"%c%" verse:"3") { previousChapter nextChapter } } }'
            .replace('%c%', chap);
        const result = await pk.gqlQuery(query);
        t.equal(result.errors, undefined);
        const nav = result.data.documents[0].nav;
        t.equal(nav.previousChapter, prev);
        t.equal(nav.nextChapter, next);
      }
    } catch (err) {
      console.log(err);
    }
  },
);