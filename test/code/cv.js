const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'CV';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const chapterQuery = `cv (chapter:"3") {type subType payload }`;
const verseQuery = `cv (chapter:"3" verses:["6"]) {type subType payload }`;
const versesQuery = `cv (chapter:"3" verses:["6", "7"]) {type subType payload }`;
const chapterVersesQuery = `cv (chapterVerses:"3:18-4:1") {type subType payload }`;

test(
  `Chapter (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const query = `{ documents { ${chapterQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verse (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const query = `{ documents { ${verseQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verses (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const query = `{ documents { ${versesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `ChapterVerses (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const query = `{ documents { ${chapterVersesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);