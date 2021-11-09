const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'CV';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk2 = pkWithDoc('../test_data/usfm/web_psa51.usfm', {
  lang: 'eng',
  abbr: 'web',
})[0];

const chapterQuery = `cv (chapter:"3") { scopeLabels, items { type subType payload } tokens { subType payload } text }`;
const verseQuery = `cv (chapter:"3" verses:["6"]) { scopeLabels, items { type subType payload } tokens { subType payload } text }`;
const versesQuery = `cv (chapter:"3" verses:["6", "7"]) { scopeLabels, items { type subType payload } tokens { subType payload } text }`;
const chapterVersesQuery = `cv (chapterVerses:"3:18-4:1" includeContext:true ) { scopeLabels items { type subType payload position } tokens { subType payload position } text }`;
const repeatChapterVersesQuery = `cv (chapterVerses:"3:16-3:18" includeContext:true ) { scopeLabels items { type subType payload position } tokens { subType payload position } text }`;
const singleChapterVersesQuery = `cv (chapterVerses:"3:16-18" includeContext:true ) { scopeLabels items { type subType payload position } tokens { subType payload position } text }`;
const singleVerseChapterVersesQuery = `cv (chapterVerses:"3:16" includeContext:true ) { scopeLabels items { type subType payload position } tokens { subType payload position } text }`;
const multiParaSingleVerseChapterVersesQuery = `cv (chapterVerses:"51:1") { text }`;

test(
  `Chapter (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      const query = `{ documents { ${chapterQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.equal(cv[0].items[0].payload, 'blockTag/p');
      t.equal(cv[0].items[1].payload, 'chapter/3');
      t.equal([...cv[0].items].reverse()[0].payload, 'blockTag/p');
      t.equal([...cv[0].items].reverse()[1].payload, 'chapter/3');
      t.equal(cv[0].tokens[0].payload, 'Naomi');
      t.equal([...cv[0].tokens].reverse()[2].payload, 'today');
      t.ok(cv[0].text.startsWith('Naomi her mother-in-law'));
      t.ok(cv[0].text.endsWith('settled this today.”'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verse (${testGroup})`,
  async function (t) {
    try {
      t.plan(13);
      const query = `{ documents { ${verseQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.ok(cv[0].scopeLabels.includes('verse/6'));
      t.equal(cv[0].items[0].payload, 'blockTag/p');
      t.equal(cv[0].items[1].payload, 'verse/6');
      t.equal(cv[0].items[2].payload, 'verses/6');
      t.equal([...cv[0].items].reverse()[0].payload, 'blockTag/p');
      t.equal([...cv[0].items].reverse()[1].payload, 'verse/6');
      t.equal([...cv[0].items].reverse()[2].payload, 'verses/6');
      const wordTokens = cv[0].tokens.filter(t => t.subType === 'wordLike');
      t.equal(wordTokens[0].payload, 'She');
      t.equal([...wordTokens].reverse()[0].payload, 'her');
      t.ok(cv[0].text.startsWith('She went down'));
      t.ok(cv[0].text.endsWith('told her. '));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Multi-Para Verse (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = `{ documents { ${multiParaSingleVerseChapterVersesQuery} } }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.ok(cv[0].text.startsWith('Have mercy'));
      t.ok(cv[0].text.endsWith('transgressions.'));
      t.ok(cv[0].text.includes('kindness. According'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Verses (${testGroup})`,
  async function (t) {
    try {
      t.plan(14);
      const query = `{ documents { ${versesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.ok(cv[0].scopeLabels.includes('verse/6'));
      t.ok(cv[1].scopeLabels.includes('verse/7'));
      t.equal(cv[0].items[0].payload, 'blockTag/p');
      t.equal(cv[0].items[1].payload, 'verse/6');
      t.equal(cv[0].items[2].payload, 'verses/6');
      t.equal([...cv[1].items].reverse()[0].payload, 'blockTag/p');
      t.equal([...cv[1].items].reverse()[1].payload, 'verse/7');
      t.equal([...cv[1].items].reverse()[2].payload, 'verses/7');
      let wordTokens = cv[0].tokens.filter(t => t.subType === 'wordLike');
      wordTokens = wordTokens.concat(cv[1].tokens.filter(t => t.subType === 'wordLike'));
      t.equal(wordTokens[0].payload, 'She');
      t.equal([...wordTokens].reverse()[0].payload, 'down');
      t.ok(cv[0].text.startsWith('She went down'));
      t.ok(cv[1].text.endsWith('and lay down. '));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `ChapterVerses (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const query = `{ documents { ${chapterVersesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.equal(cv.length, 2);
      t.equal(cv[0].tokens[0].payload, 'Then');
      t.equal([...cv[0].tokens].reverse()[0].payload, '”');
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.ok(cv[0].scopeLabels.includes('verse/18'));
      t.ok(cv[0].scopeLabels.includes('verses/18'));
      t.ok(cv[1].scopeLabels.includes('chapter/4'));
      t.ok(cv[1].scopeLabels.includes('verse/1'));
      t.ok(cv[1].scopeLabels.includes('verses/1'));
      t.ok(cv[0].text.startsWith('Then she said'));
      t.ok(cv[1].text.endsWith('and sat down. '));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Repeat-chapter chapterVerses (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const query = `{ documents { ${repeatChapterVersesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.equal(cv.length, 3);
      const wordLikes = cv[0].tokens.filter(t => t.subType === 'wordLike');
      t.equal(wordLikes[0].payload, 'When');
      t.equal([...wordLikes].reverse()[0].payload, 'her');
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.ok(cv[0].scopeLabels.includes('verse/16'));
      t.ok(cv[0].scopeLabels.includes('verses/16'));
      t.ok(cv[2].scopeLabels.includes('chapter/3'));
      t.ok(cv[2].scopeLabels.includes('verse/18'));
      t.ok(cv[2].scopeLabels.includes('verses/18'));
      t.ok(cv[0].text.startsWith('When she came'));
      t.ok(cv[2].text.endsWith('settled this today.”'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Single-chapter chapterVerses (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const query = `{ documents { ${singleChapterVersesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.equal(cv.length, 3);
      const wordLikes = cv[0].tokens.filter(t => t.subType === 'wordLike');
      t.equal(wordLikes[0].payload, 'When');
      t.equal([...wordLikes].reverse()[0].payload, 'her');
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.ok(cv[0].scopeLabels.includes('verse/16'));
      t.ok(cv[0].scopeLabels.includes('verses/16'));
      t.ok(cv[2].scopeLabels.includes('chapter/3'));
      t.ok(cv[2].scopeLabels.includes('verse/18'));
      t.ok(cv[2].scopeLabels.includes('verses/18'));
      t.ok(cv[0].text.startsWith('When she came'));
      t.ok(cv[2].text.endsWith('settled this today.”'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Single-verse chapterVerses (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const query = `{ documents { ${singleVerseChapterVersesQuery} } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const cv = result.data.documents[0].cv;
      t.equal(cv.length, 1);
      const wordLikes = cv[0].tokens.filter(t => t.subType === 'wordLike');
      t.equal(wordLikes[0].payload, 'When');
      t.equal([...wordLikes].reverse()[0].payload, 'her');
      t.ok(cv[0].scopeLabels.includes('chapter/3'));
      t.ok(cv[0].scopeLabels.includes('verse/16'));
      t.ok(cv[0].scopeLabels.includes('verses/16'));
      t.ok(cv[0].text.startsWith('When she came'));
      t.ok(cv[0].text.endsWith('done for her. '));
    } catch (err) {
      console.log(err);
    }
  },
);
