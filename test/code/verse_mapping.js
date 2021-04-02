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
  `origCv (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const pk = pkWithDocs([
        ['../test_data/usx/web_psa_40_60.usx', {
          lang: 'eng',
          abbr: 'webbe',
        }],
        ['../test_data/usx/douay_rheims_psa_40_60.usx', {
          lang: 'eng',
          abbr: 'drh',
        }],
      ]);
      let vrs = fse.readFileSync(path.resolve(__dirname, '../test_data/vrs/webbe.vrs'))
        .toString();
      let mutationQuery = `mutation { setVerseMapping(docSetId: "eng_webbe" vrsSource: """${vrs}""")}`;
      let result = await pk.gqlQuery(mutationQuery);
      t.equal(result.errors, undefined);
      vrs = fse.readFileSync(path.resolve(__dirname, '../test_data/vrs/douay_rheims.vrs'))
        .toString();
      mutationQuery = `mutation { setVerseMapping(docSetId: "eng_drh" vrsSource: """${vrs}""")}`;
      result = await pk.gqlQuery(mutationQuery);
      t.equal(result.errors, undefined);
      let docSetQuery =
        '{ docSets { id documents { bookCode: header(id: "bookCode") psa_51_1: origCv(chapter: "51" verses: ["1"]) { text } psa_51_2: origCv(chapter: "51" verses: ["2"]) { text } } } }';
      result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data, null, 2));
      const web_doc = result.data.docSets.filter(ds => ds.id === "eng_webbe")[0].documents[0];
      t.ok(web_doc.psa_51_1[0].text.startsWith('For the Chief'));
      t.ok(web_doc.psa_51_2[0].text.startsWith('For the Chief'));
      const dr_doc = result.data.docSets.filter(ds => ds.id === "eng_drh")[0].documents[0];
      t.ok(dr_doc.psa_51_1[0].text.startsWith('Unto the end'));
      t.ok(dr_doc.psa_51_2[0].text.startsWith('When Nathan'));
    } catch (err) {
      console.log(err);
    }
  },
);
