const test = require('tape');
const fse = require('fs-extra');
const path = require('path');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Verse Mapping';

const pk = pkWithDoc('../test_data/usx/web_psa.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `hasMapping (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
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
      t.plan(8);
      const pk = pkWithDoc('../test_data/usx/web_psa.usx', {
        lang: 'eng',
        abbr: 'web',
      })[0];
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
      // console.log(JSON.stringify(result.data.docSets[0].documents[0].cvIndex, null, 2));
      t.equal(result.data.docSets[0].hasMapping, true);
      mutationQuery = `mutation { unsetVerseMapping(docSetId: "${docSetId}")}`;
      result = await pk.gqlQuery(mutationQuery);
      t.equal(result.errors, undefined);
      docSetQuery =
        '{ docSets { id hasMapping} }';
      result = await pk.gqlQuery(docSetQuery);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].hasMapping, false);
    } catch (err) {
      console.log(err);
    }
  },
);