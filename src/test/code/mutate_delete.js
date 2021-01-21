const test = require('tape');
const { pkWithDoc, pkWithDocs } = require('../lib/load');

const testGroup = 'Mutate Delete Operations';

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const pk = pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], [])[0];
      let query = '{ docSets { id } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      query = `mutation { deleteDocSet(docSetId: "foo/baa") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteDocSet, false);
      query = '{ docSets { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 1);
      query = `mutation { deleteDocSet(docSetId: "${result.data.docSets[0].id}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteDocSet, true);
      query = '{ docSets { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const pk = pkWithDocs(
        [
          ['../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }],
          ['../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }],
        ],
      );
      let query = '{ docSets { id documents { id } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      t.equal(result.data.docSets[0].documents.length, 2);
      const aDocumentId = result.data.docSets[0].documents[0].id;
      query = `mutation { deleteDocument(docSetId: "${result.data.docSets[0].id}", documentId: "foobaa") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteDocument, false);
      query = '{ docSets { id documents { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets[0].documents.length, 2);
      query = `mutation { deleteDocument(docSetId: "${result.data.docSets[0].id}", documentId: "${aDocumentId}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteDocument, true);
      query = '{ docSets { id documents { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);