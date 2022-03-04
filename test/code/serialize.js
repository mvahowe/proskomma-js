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

const pk3 = pkWithDoc('../test_data/usfm/78-GALspavbl.usfm', {
  lang: 'spa',
  abbr: 'vbl',
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
      t.plan(11);
      let query = '{ docSets { id } }';
      let result = await pk.gqlQuery(query);
      const docSetId = result.data.docSets[0].id;
      const serialized = pk.serializeSuccinct(docSetId);
      // console.log(JSON.stringify(serialized, null, 2));
      const pk2 = new (Proskomma);
      pk2.loadSuccinctDocSet(serialized);
      t.equal(pk2.nDocSets(), 1);
      t.equal(pk2.nDocuments(), 1);
      const wordLikes = unpackEnum(pk2.docSets[docSetId].enums['wordLike']);
      t.ok(wordLikes.includes('Ruth'));
      query = '{ docSets { id documents { id } } documents { cv(chapter:"1") { text } cv2: cv(chapter:"1" verses:"1") { text } mainSequence { id blocks { text items { type } } } } }';
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      t.equal(result.data.docSets[0].documents.length, 1);
      t.equal(result.data.documents.length, 1);
      t.ok(result.data.documents[0].cv[0].text.startsWith("In the days"));
      t.ok(result.data.documents[0].cv2[0].text.startsWith("In the days"));
      const firstBlock = result.data.documents[0].mainSequence.blocks[0];
      t.ok(firstBlock.text.startsWith('In the days when the judges judged'));
      t.throws(() => pk2.loadSuccinctDocSet(serialized), /already loaded/);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Load Text with Accents (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      let query = '{ docSets { id } }';
      let result = await pk3.gqlQuery(query);
      const docSetId = result.data.docSets[0].id;
      const serialized = pk3.serializeSuccinct(docSetId);
      const pk2 = new (Proskomma);
      pk2.loadSuccinctDocSet(serialized);
      t.equal(pk2.nDocSets(), 1);
      t.equal(pk2.nDocuments(), 1);
      const wordLikes = unpackEnum(pk2.docSets[docSetId].enums['wordLike']);
      t.ok(wordLikes.includes('Gálatas'));
      query = '{ documents { header(id:"h") headers {key value} } }';
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 1);
      t.ok(result.data.documents[0].header === 'Gálatas');
      t.ok(result.data.documents[0].headers.filter(h => h.key === 'h')[0].value === 'Gálatas');
    } catch (err) {
      console.log(err);
    }
  },
);
