const test = require('tape');
const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], [])[0];

const testGroup = 'Mutate Tags';

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query = '{ docSets { id tags } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docSet = result.data.docSets[0];
      t.equal(docSet.tags.length, 0);
      query = `mutation { addDocSetTags(docSetId: "${docSet.id}", tags: ["foo", "baa"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addDocSetTags.length, 2);
      query = `mutation { addDocSetTags(docSetId: "${docSet.id}", tags: ["foo", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addDocSetTags.length, 3);
      query = `mutation { removeDocSetTags(docSetId: "${docSet.id}", tags: ["baa", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.removeDocSetTags.length, 1);
      t.ok(result.data.removeDocSetTags.includes("foo"));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query = '{ docSets { id documents { id tags } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docSet = result.data.docSets[0];
      const document = docSet.documents[0];
      t.equal(document.tags.length, 0);
      query = `mutation { addDocumentTags(docSetId: "${docSet.id}", documentId: "${document.id}", tags: ["foo", "baa"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addDocumentTags.length, 2);
      query = `mutation { addDocumentTags(docSetId: "${docSet.id}", documentId: "${document.id}", tags: ["foo", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addDocumentTags.length, 3);
      query = `mutation { removeDocumentTags(docSetId: "${docSet.id}", documentId: "${document.id}", tags: ["baa", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.removeDocumentTags.length, 1);
      t.ok(result.data.removeDocumentTags.includes("foo"));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query = '{ docSets { id documents { id mainSequence { id tags } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docSet = result.data.docSets[0];
      const document = docSet.documents[0];
      const sequence = document.mainSequence;
      t.equal(sequence.tags.length, 0);
      query = `mutation { addSequenceTags(docSetId: "${docSet.id}", documentId: "${document.id}", sequenceId: "${sequence.id}", tags: ["foo", "baa"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addSequenceTags.length, 2);
      query = `mutation { addSequenceTags(docSetId: "${docSet.id}", documentId: "${document.id}", sequenceId: "${sequence.id}", tags: ["foo", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addSequenceTags.length, 3);
      query = `mutation { removeSequenceTags(docSetId: "${docSet.id}", documentId: "${document.id}", sequenceId: "${sequence.id}", tags: ["baa", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.removeSequenceTags.length, 1);
      t.ok(result.data.removeSequenceTags.includes("foo"));
    } catch (err) {
      console.log(err);
    }
  },
);
