const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'CV Indexes';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk2 = pkWithDoc('../test_data/usfm/web_psa51.usfm', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk3 = pkWithDoc('../test_data/usfm/verse_range.usfm', {
  lang: 'eng',
  abbr: 'web',
})[0];

const rangeQuery = 'startBlock startItem endBlock endItem nextToken items { type subType payload } tokens { type subType payload } text dumpItems';
const cvQuery = `{ chapter verseNumbers { number range } verseRanges { range numbers } verses { verse { ${rangeQuery} verseRange } } }`;
const cQuery = `{ chapter ${rangeQuery} }`;
const cvCharsQuery = `{ chapter verses { verse { tokens(includeContext:true withChars:["Ruth", "Boaz", "Naomi"]) { payload position} text } } }`;

const checkIndexFields = (t, index) => {
  t.ok('startBlock' in index);
  t.ok('endBlock' in index);
  t.ok('startItem' in index);
  t.ok('endItem' in index);
  t.ok('nextToken' in index);
  t.ok(index.text.length > 0);
  t.ok(index.items.length > 0);
  t.ok(index.tokens.length > 0);
  t.ok(index.dumpItems.length > 0);
};

test(
  `cvIndexes (${testGroup})`,
  async function (t) {
    try {
      t.plan(1 + 9);
      const query =
        `{ documents { cvIndexes ${cvQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const index = result.data.documents[0].cvIndexes[0];
      checkIndexFields(t, index.verses[1].verse[0]);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cIndexes (${testGroup})`,
  async function (t) {
    try {
      t.plan(1 + 9);
      const query =
        `{ documents { cIndexes ${cQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const index = result.data.documents[0].cIndexes[0];
      checkIndexFields(t, index);
      // console.log(JSON.stringify(result.data.documents[0].cIndexes, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvIndex (${testGroup})`,
  async function (t) {
    try {
      t.plan(2 + 9 + 6);
      let query =
        `{ documents { cvIndex(chapter:3) ${cvQuery} } }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let index = result.data.documents[0].cvIndex;
      t.equal(index.chapter, 3);
      checkIndexFields(t, index.verses[1].verse[0]);
      const verseNumbers = result.data.documents[0].cvIndex.verseNumbers;
      t.equal(verseNumbers.length, 18);
      t.equal(Math.max(...verseNumbers.map(n => n.number)), 18);
      t.equal(Math.min(...verseNumbers.map(n => n.number)), 1);
      query =
        `{ documents { cvIndex(chapter:9) ${cvQuery} } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      index = result.data.documents[0].cvIndex;
      t.equal(index.chapter, 9);
      t.equal(index.verses.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvIndex v0 (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      let query =
        `{ documents { cvIndex(chapter:51) ${cvQuery} } }`;
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const verseNumbers = result.data.documents[0].cvIndex.verseNumbers;
      t.equal(verseNumbers.length, 20);
      t.equal(Math.max(...verseNumbers.map(n => n.number)), 19);
      t.equal(Math.min(...verseNumbers.map(n => n.number)), 0);
      // console.log(JSON.stringify(result.data.documents[0].cvIndex.verses.map(v => v.verse[0].dumpItems), null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvIndex verseRanges (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query =
        `{ documents { cvIndex(chapter:1) ${cvQuery} } }`;
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data.documents[0].cvIndex.verseRanges, null, 2));
      const verseRanges = result.data.documents[0].cvIndex.verseRanges;
      t.equal(verseRanges.length, 1);
      t.equal(verseRanges[0].range, '1-2');
      t.equal(verseRanges[0].numbers.length, 2);
      t.equal(verseRanges[0].numbers[0], 1);
      t.equal(verseRanges[0].numbers[1], 2);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cIndex (${testGroup})`,
  async function (t) {
    try {
      t.plan(2 + 9 + 3);
      let query =
        `{ documents { cIndex(chapter:3) ${cQuery} } }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let index = result.data.documents[0].cIndex;
      t.equal(index.chapter, 3);
      checkIndexFields(t, index);
      query =
        `{ documents { cIndex(chapter:9) ${cQuery} } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      index = result.data.documents[0].cIndex;
      t.equal(index.chapter, 9);
      t.equal(index.startBlock, null);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `cvIndexes withChars (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      let query =
        `{ documents { cvIndexes ${cvCharsQuery} } }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);
