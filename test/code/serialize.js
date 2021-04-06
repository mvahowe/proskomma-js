const test = require('tape');
const Validator = require('jsonschema').Validator;
const {
  serializedSchema,
  unpackEnum,
} = require('proskomma-utils');

const { Proskomma } = require('../../src');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Serialize';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Serialize WEB RUT (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ docSets { id } }';
      const result = await pk.gqlQuery(query);
      const docSetId = result.data.docSets[0].id;
      const serialized = pk.serializeSuccinct(docSetId);
      t.ok(serialized);
      const validationReport = new Validator().validate(serialized, serializedSchema);
      t.equal(validationReport.errors.length, 0);
      const wordLikes = unpackEnum(pk.docSets[docSetId].enums['wordLike']);
      t.ok(wordLikes.includes('Ruth'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Load WEB RUT (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ docSets { id } }';
      let result = await pk.gqlQuery(query);
      const docSetId = result.data.docSets[0].id;
      const serialized = pk.serializeSuccinct(docSetId);
      // console.log(JSON.stringify(serialized, null, 2));
      const pk2 = new (Proskomma);
      pk2.loadSuccinctDocSet(serialized);
      t.equal(pk2.nDocSets(), 1);
      t.equal(pk2.nDocuments(), 1);
      const wordLikes = unpackEnum(pk.docSets[docSetId].enums['wordLike']);
      t.ok(wordLikes.includes('Ruth'));
      query = '{ docSets { id documents { id } } documents { cv(chapter:"1") { text } mainSequence { id blocks { text items { type } } } } }';
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      t.equal(result.data.docSets[0].documents.length, 1);
      t.equal(result.data.documents.length, 1);
      t.ok(result.data.documents[0].cv[0].text.startsWith("In the days"));
      const firstBlock = result.data.documents[0].mainSequence.blocks[0];
      t.ok(firstBlock.text.startsWith('In the days when the judges judged'));
    } catch (err) {
      console.log(err);
    }
  },
);
