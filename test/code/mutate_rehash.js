const test = require('tape');
const fse = require('fs-extra');
const path = require('path');
const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
}, {}, {}, [], [])[0];

const testGroup = 'Rehash';

test(
  `One Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ docSets { id documents { id mainSequence { nBlocks blocks { dump } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      const nMainSequenceBlocks = result.data.docSets[0].documents[0].mainSequence.nBlocks;
      query = `mutation { rehashDocSet(docSetId: "${result.data.docSets[0].id}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.rehashDocSet, true);
      query = '{ docSets { id documents { id mainSequence { nBlocks blocks { dump } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      t.equal(result.data.docSets[0].documents.length, 1);
      t.equal(result.data.docSets[0].documents[0].mainSequence.nBlocks, nMainSequenceBlocks);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `After adding document (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query = '{ docSets { id documents { id mainSequence { nBlocks blocks { dump } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      const firstDocumentId = result.data.docSets[0].documents[0].id;
      const nMainSequenceBlocks = result.data.docSets[0].documents[0].mainSequence.nBlocks;
      const content = fse.readFileSync(path.resolve(__dirname, '../test_data/usx/web_rut.usx'));
      pk.importDocument({
        lang: 'eng',
        abbr: 'web',
      }, 'usx', content);
      query = `mutation { rehashDocSet(docSetId: "${result.data.docSets[0].id}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.rehashDocSet, true);
      query = '{ docSets { id documents { id mainSequence { nBlocks blocks { dump } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].documents.length, 2);
    } catch (err) {
      console.log(err);
    }
  },
);