const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'CV Indexes';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const rangeQuery = 'startBlock startItem endBlock endItem nextToken items { type subType payload } tokens { type subType payload } text';
const cvQuery = `{ chapter verses { verse { ${rangeQuery} } } }`;
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
}

test(
  `cvIndexes (${testGroup})`,
  async function (t) {
    try {
      t.plan(1 + 8);
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
      t.plan(1 + 8);
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
      t.plan(2 + 8 + 3);
      let query =
        `{ documents { cvIndex(chapter:3) ${cvQuery} } }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let index = result.data.documents[0].cvIndex;
      t.equal(index.chapter, 3);
      checkIndexFields(t, index.verses[1].verse[0]);
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
  `cIndex (${testGroup})`,
  async function (t) {
    try {
      t.plan(2 + 8 + 3);
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
