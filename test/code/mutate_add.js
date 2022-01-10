const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const { Proskomma } = require('../../src');
const { pkWithDocs } = require('../lib/load');
const { blocksSpec2Query } = require('../../src/util/blocksSpec');

const testGroup = 'Mutate Add Operations';

const pk = new Proskomma();
let content = fse.readFileSync(
  path.resolve(__dirname, '../test_data/usx/web_rut.usx'),
).toString();

test(
  `Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let query = '{ docSets { id } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 0);
      query = `mutation { addDocument(` +
        `selectors: [{key: "lang", value: "eng"}, {key: "abbr", value: "ust"}], ` +
        `contentType: "usx", ` +
        `content: """${content}"""` +
        `tags: ["foo", "baa"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.addDocument, true);
      query = '{ docSets { id documents { id tags mainSequence { nBlocks } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 1);
      t.equal(result.data.docSets[0].documents.length, 1);
      t.ok(result.data.docSets[0].documents[0].mainSequence.nBlocks > 0);
      t.equal(result.data.docSets[0].documents[0].tags.length, 2);
      t.ok(result.data.docSets[0].documents[0].tags.includes('foo'));
      t.ok(result.data.docSets[0].documents[0].tags.includes('baa'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { id nSequences sequences { id type } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docId = result.data.documents[0].id;
      const nSequences = result.data.documents[0].nSequences;
      t.equal(result.data.documents[0].sequences.filter(s => s.type === 'banana').length, 0);
      query = `mutation { newSequence(` +
        ` documentId: "${docId}"` +
        ` type: "banana"` +
        ` tags: ["yellow", "tasty"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSequenceId = result.data.newSequence;
      query = '{ documents { id nSequences sequences { id type tags } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].nSequences, nSequences + 1);
      const bananaSequence = result.data.documents[0].sequences.filter(s => s.type === 'banana');
      t.equal(bananaSequence.length, 1);
      t.equal(result.data.documents[0].sequences.filter(s => s.id === newSequenceId).length, 1);
      t.ok(bananaSequence[0].tags.includes('yellow'));
      t.ok(bananaSequence[0].tags.includes('tasty'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence with graft (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ documents { id nSequences sequences { id type } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docId = result.data.documents[0].id;
      const nSequences = result.data.documents[0].nSequences;
      t.equal(result.data.documents[0].sequences.filter(s => s.type === 'table').length, 0);
      query = `mutation { newSequence(` +
        ` documentId: "${docId}"` +
        ` type: "table"` +
        ` graftToMain: true) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSequenceId = result.data.newSequence;
      query = '{ documents { id mainSequence { id blocks { bg { payload } } } nSequences sequences { id type } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].nSequences, nSequences + 1);
      t.equal(result.data.documents[0].sequences.filter(s => s.type === 'table').length, 1);
      t.equal(result.data.documents[0].sequences.filter(s => s.id === newSequenceId).length, 1);
      const mainSequenceFirstBlockGrafts = result.data.documents[0].mainSequence.blocks[0].bg.map(g => g.payload);
      t.ok(mainSequenceFirstBlockGrafts.includes(newSequenceId));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence with block content (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const blocksSpec = fse.readJSONSync(path.resolve(__dirname, '../test_data/inputBlockSpec/mk1.json'));
      const blockQuery = blocksSpec2Query(blocksSpec);
      let query = '{ documents { id nSequences sequences { id type } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docId = result.data.documents[0].id;
      const nSequences = result.data.documents[0].nSequences;
      t.equal(result.data.documents[0].sequences.filter(s => s.type === 'table').length, 1);
      query = `mutation { newSequence(` +
        ` documentId: "${docId}"` +
        ` type: "randomText"` +
        ` blocksSpec: ${blockQuery}` +
        ` graftToMain: true) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSequenceId = result.data.newSequence;
      query = '{ documents { id nSequences sequences { id type blocks { text } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].nSequences, nSequences + 1);
      const newSequence = result.data.documents[0].sequences.filter(s => s.id === newSequenceId)[0];
      t.equal(result.data.documents[0].sequences.filter(s => s.id === newSequenceId).length, 1);
      t.equal(newSequence.type, 'randomText');
      t.ok(newSequence.blocks[0].text.startsWith('Start of the Good News'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Block (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
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
      query = `mutation { newBlock(documentId: "${docId}" sequenceId: "${seqId}" blockN: 1, blockScope: "blockTag/q4") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.newBlock, true);
      query = '{ documents { id mainSequence { id nBlocks blocks(positions:[1]) { bs { payload } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].mainSequence.nBlocks, nBlocks + 1);
      t.equal(result.data.documents[0].mainSequence.blocks[0].bs.payload, 'blockTag/q4');
    } catch (err) {
      console.log(err);
    }
  },
);

