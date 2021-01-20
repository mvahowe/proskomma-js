const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const { ProsKomma } = require('../../../src');
const { escapeStringQuotes } = require('../lib/load');

const testGroup = 'Mutate Add Operations';

const pk = new ProsKomma();
let content = fse.readFileSync(
  path.resolve(__dirname, '../test_data/usx/web_rut.usx'),
).toString();

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      let query = '{ docSets { id } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 0);
      query = `mutation { addDocument(` +
          `selectors: [{key: "lang", value: "eng"}, {key: "abbr", value: "ust"}], `+
          `contentType: "usx", ` +
          `content: """${content}""") }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.addDocument, true);
      query = '{ docSets { id documents { id mainSequence { nBlocks } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 1);
      t.equal(result.data.docSets[0].documents.length, 1);
      t.ok(result.data.docSets[0].documents[0].mainSequence.nBlocks > 0);
    } catch (err) {
      console.log(err);
    }
  },
);