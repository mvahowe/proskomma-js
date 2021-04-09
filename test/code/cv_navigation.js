const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'cv Navigation';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk2 = pkWithDoc('../test_data/usx/web_psa_40_60.usx', {
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

test(
  `Next/Previous Verse (${testGroup})`,
  async function (t) {
    try {
      const expected = [
        [pk, 2, 3, 2, 2, 2, 4],
        [pk, 1, 22, 1, 21, 2, 1],
        [pk, 2, 1, 1, 22, 2, 2],
        [pk, 1, 1, null, null, 1, 2],
        [pk, 5, 1, null, null, null, null],
        [pk, 1, 0, null, null, null, null],
        [pk, 1, 50, null, null, null, null],
        [pk2, 50, 23, 50, 22, 51, 0],
        [pk2, 51, 1, 51, 0, 51, 2],
        [pk2, 51, 0, 50, 23, 51, 1],
      ];
      t.plan(5 * expected.length);
      for (const [pros, chap, verse, prevChap, prevVerse, nextChap, nextVerse] of expected) {
        const query =
          '{ documents { nav: cvNavigation(chapter:"%c%" verse:"%v%") { previousVerse { chapter verse } nextVerse { chapter verse } } } }'
            .replace('%c%', chap)
            .replace('%v%', verse);
        const result = await pros.gqlQuery(query);
        t.equal(result.errors, undefined);
        const nav = result.data.documents[0].nav;
        t.equal(nav.nextVerse && nav.nextVerse.chapter, nextChap);
        t.equal(nav.nextVerse && nav.nextVerse.verse, nextVerse);
        t.equal(nav.previousVerse && nav.previousVerse.chapter, prevChap);
        t.equal(nav.previousVerse && nav.previousVerse.verse, prevVerse);
      }
    } catch (err) {
      console.log(err);
    }
  },
);