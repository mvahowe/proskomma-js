const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const {
  pkWithDoc,
  pkWithDocs,
} = require('../lib/load');
const { Proskomma } = require('../../src');

const testGroup = 'Mutate Delete Operations';

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
        lang: 'eng',
        abbr: 'ust',
      }, {}, {}, [], [])[0];
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
      query = '{ nDocSets nDocuments }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.nDocSets, 0);
      t.equal(result.data.nDocuments, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Reload Deleted DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const selectors = {
        lang: 'eng',
        abbr: 'ust',
      };
      const pk = pkWithDoc('../test_data/usx/web_rut.usx', selectors, {}, {}, [], [])[0];
      let query = '{ docSets { id } }';
      let result = await pk.gqlQuery(query);
      query = `mutation { deleteDocSet(docSetId: "${result.data.docSets[0].id}") }`;
      result = await pk.gqlQuery(query);
      query = '{ docSets { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 0);
      const content = fse.readFileSync(path.resolve(__dirname, '../test_data/usx/web_rut.usx'));

      t.doesNotThrow(
        () => pk.importDocument(
          selectors,
          'usx',
          content,
          {},
        ),
      );
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
          ['../test_data/usx/web_rut.usx', {
            lang: 'eng',
            abbr: 'ust',
          }],
          ['../test_data/usx/web_psa150.usx', {
            lang: 'eng',
            abbr: 'ust',
          }],
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

test(
  `Inline Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const pk = pkWithDocs(
        [
          ['../test_data/usx/web_rut.usx', {
            lang: 'eng',
            abbr: 'ust',
          }],
        ],
      );
      let query = '{ documents { id nSequences mainSequence { id blocks(positions:[0]) { items { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 1);
      const docId = result.data.documents[0].id;
      const nSequences = result.data.documents[0].nSequences;
      const items = result.data.documents[0].mainSequence.blocks[0].items;
      const mainId = result.data.documents[0].mainSequence.id;
      const graft = items.filter(i => i.type === 'graft')[0];
      query = `mutation { deleteSequence(documentId: "foo" sequenceId: "${graft.payload}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.startsWith('Document \'foo\' not found'));
      query = `mutation { deleteSequence(documentId: "${docId}" sequenceId: "${mainId}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.startsWith('Cannot delete main sequence'));
      query = `mutation { deleteSequence(documentId: "${docId}" sequenceId: "baa") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteSequence, false);
      query = `mutation { deleteSequence(documentId: "${docId}" sequenceId: "${graft.payload}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteSequence, true);
      query = '{ documents { id nSequences mainSequence { id blocks(positions:[0]) { items { type subType payload } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].nSequences, nSequences - 2);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Block-Grafted Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = pkWithDocs(
        [
          ['../test_data/usx/not_nfc18_phm.usx', {
            lang: 'fra',
            abbr: 'nfc18',
          }],
        ],
      );
      let query = '{ documents { id nSequences mainSequence { id blocks(positions:[0]) { bg { subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 1);
      const docId = result.data.documents[0].id;
      const nSequences = result.data.documents[0].nSequences;
      const graftSeqId = result.data.documents[0].mainSequence.blocks[0].bg[0].payload;
      query = `mutation { deleteSequence(documentId: "${docId}" sequenceId: "${graftSeqId}") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteSequence, true);
      query = '{ documents { id nSequences } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].nSequences, nSequences - 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Block (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = pkWithDocs(
        [
          ['../test_data/usfm/1pe_webbe.usfm', {
            lang: 'eng',
            abbr: 'web',
          }],
        ],
      );
      let query = '{ documents { id mainSequence { id nBlocks } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docId = result.data.documents[0].id;
      const seqId = result.data.documents[0].mainSequence.id;
      const nBlocks = result.data.documents[0].mainSequence.nBlocks;
      t.equal(nBlocks, 3);
      query = `mutation { deleteBlock(documentId: "${docId}" sequenceId: "${seqId}" blockN: 1) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.deleteBlock, true);
      query = '{ documents { id mainSequence { id nBlocks  blocks { items { type subType payload } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].mainSequence.nBlocks, nBlocks - 1);
    } catch (err) {
      console.log(err);
    }
  },
);
