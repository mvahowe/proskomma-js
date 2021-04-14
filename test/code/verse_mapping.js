const path = require('path');
const fse = require('fs-extra');
const test = require('tape');
const deepCopy = require('deep-copy-all');

const { pkWithDoc, pkWithDocs } = require('../lib/load');

const testGroup = 'Verse Mapping';

const cleanPk = pkWithDoc('../test_data/usx/web_psa_40_60.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const cleanPk2 = pkWithDocs([
  ['../test_data/usx/web_psa.usx', {
    lang: 'eng',
    abbr: 'webbe',
  }],
  ['../test_data/usx/douay_rheims_psa.usx', {
    lang: 'eng',
    abbr: 'drh',
  }],
]);

const addPk2Vrs = async () => {
  let vrs = fse.readFileSync(path.resolve(__dirname, '../test_data/vrs/webbe.vrs'))
    .toString();
  let mutationQuery = `mutation { setVerseMapping(docSetId: "eng_webbe" vrsSource: """${vrs}""")}`;
  await cleanPk2.gqlQuery(mutationQuery);
  vrs = fse.readFileSync(path.resolve(__dirname, '../test_data/vrs/douay_rheims.vrs'))
    .toString();
  mutationQuery = `mutation { setVerseMapping(docSetId: "eng_drh" vrsSource: """${vrs}""")}`;
  await cleanPk2.gqlQuery(mutationQuery);
};

Promise.all([addPk2Vrs()]).then();

test(
  `hasMapping (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const pk = deepCopy(cleanPk);
      const query =
        '{ docSets { id hasMapping } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].hasMapping, false);
      const docSet = pk.docSetById(result.data.docSets[0].id);
      docSet.tags.add('hasMapping');
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].hasMapping, true);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `setVerseMapping/unsetVerseMapping (${testGroup})`,
  async function (t) {
    try {
      t.plan(15);
      const pk = deepCopy(cleanPk);
      let docSetQuery =
        '{ docSets { id hasMapping } }';
      let result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].hasMapping, false);
      const docSetId = result.data.docSets[0].id;
      const vrs = fse.readFileSync(path.resolve(__dirname, '../test_data/vrs/webbe.vrs'))
        .toString();
      let mutationQuery = `mutation { setVerseMapping(docSetId: "${docSetId}" vrsSource: """${vrs}""")}`;
      result = await pk.gqlQuery(mutationQuery);
      t.equal(result.errors, undefined);
      docSetQuery =
        '{ docSets { id hasMapping documents { cvIndex(chapter: 51) { chapter verseNumbers { number orig { book cvs { chapter verse } } } } } } }';
      result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].hasMapping, true);
      let v0 = result.data.docSets[0].documents[0].cvIndex.verseNumbers[0];
      t.equal(v0.number, 0);
      t.equal(v0.orig.cvs.length, 2);
      t.equal(v0.orig.cvs[0].verse, 1);
      t.equal(v0.orig.cvs[1].verse, 2);
      mutationQuery = `mutation { unsetVerseMapping(docSetId: "${docSetId}")}`;
      result = await pk.gqlQuery(mutationQuery);
      t.equal(result.errors, undefined);
      result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      v0 = result.data.docSets[0].documents[0].cvIndex.verseNumbers[0];
      t.equal(result.data.docSets[0].hasMapping, false);
      t.equal(v0.number, 0);
      t.equal(v0.orig.cvs.length, 1);
      t.equal(v0.orig.cvs[0].verse, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `mappedCv between docSets (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      const pk = deepCopy(cleanPk2);
      let docSetQuery =
        '{ docSet(id: "eng_webbe") { documents { web: cv(chapter: "48" verses: ["1"]) { text } drh: mappedCv(chapter: "48" verses: ["1"], mappedDocSetId: "eng_drh") { text } } } }';
      let result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      t.ok(result.data.docSet.documents[0].web[0].text.startsWith('Great is'));
      t.ok(result.data.docSet.documents[0].drh[0].text.startsWith('Great is'));
      t.ok(result.data.docSet.documents[0].web[0].text.endsWith('mountain.'));
      t.ok(result.data.docSet.documents[0].drh[0].text.endsWith('mountain.'));
      docSetQuery =
        '{ docSet(id: "eng_webbe") { documents { web: cv(chapter: "1" verses: ["1"]) { text } drh: mappedCv(chapter: "1" verses: ["1"], mappedDocSetId: "eng_drh") { text } } } }';
      result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      t.ok(result.data.docSet.documents[0].web[0].text.startsWith('Blessed is the man who does'));
      t.ok(result.data.docSet.documents[0].drh[0].text.startsWith('Blessed is the man who hath'));
      t.ok(result.data.docSet.documents[0].web[0].text.endsWith('scoffers;'));
      t.ok(result.data.docSet.documents[0].drh[0].text.endsWith('pestilence.'));
    } catch (err) {
      console.log(err);
    }
  },
);
