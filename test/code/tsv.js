const test = require('tape');

const { Proskomma } = require('../../src');

const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usfm/hello.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];

const testGroup = 'TSV';

test(
  `Import (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const pk = new Proskomma();

      pk.importDocument({
        lang: 'deu',
        abbr: 'xyz',
      }, 'tsv',
      JSON.stringify(
        {
          headings: ['firstCol', 'secondCol'],
          rows: [
            ['ab.c', 'c ba'],
            ['de.f', 'f ed'],
            ['gh.i', 'i hg'],
          ],
        },
      ),
      {},
      );

      let query = '{documents { tags mainSequence { id } sequences { id type blocks { bs { payload} bg { payload } is { payload } tokens { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const doc = result.data.documents[0];
      t.equal(doc.tags.length, 2);
      t.equal(doc.tags[0], 'col0:firstCol');
      const mainSequence = doc.sequences.filter(s => s.id === doc.mainSequence.id)[0];
      const tableGraft = mainSequence.blocks[0].bg[0].payload;
      const tableSequence = doc.sequences.filter(s => s.id === tableGraft)[0];
      t.equal(tableSequence.type, 'table');
      t.equal(tableSequence.blocks.length, 6);
      t.equal(tableSequence.blocks.filter(b => b.bs.payload === 'tTableRow/1').length, 2);
      t.equal(tableSequence.blocks.filter(b => b.is.map(s => s.payload).includes('tTableCol/1')).length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Return error for tableSequence on non-table sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query = '{documents { id mainSequence { id } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docId = result.data.documents[0].id;
      const seqId = result.data.documents[0].mainSequence.id;
      query = `{document(id:"${docId}") { tableSequence(id:"${seqId}") { id } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.includes('type \'table\', not \'main\''));
    } catch (err) {
      console.log(err);
    }
  },
);
