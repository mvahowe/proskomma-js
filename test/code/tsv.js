const test = require('tape');

const { Proskomma } = require('../../src');

const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usfm/hello.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];

const importTSV = pk => {
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
};

const testGroup = 'TSV';

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

test(
  `Import (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const pk = new Proskomma();
      importTSV(pk);
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
  `Query (${testGroup})`,
  async function (t) {
    try {
      t.plan(16);
      const pk = new Proskomma();
      importTSV(pk);
      let query = '{docSets { document(bookCode:"T01") { sequences(types:"table") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tableSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{docSets { document(bookCode:"T01") { tableSequence(id:"${tableSequenceId}") { nCells nRows nColumns cells { rows columns items { payload } tokens { payload } text } } } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequence = result.data.docSets[0].document.tableSequence;
      t.equal(sequence.nCells, 6);
      t.equal(sequence.nRows, 3);
      t.equal(sequence.nColumns, 2);
      t.equal(sequence.cells.length, 6);
      const firstCell = sequence.cells[0];
      t.equal(firstCell.rows[0], 0);
      t.equal(firstCell.columns[0], 0);
      t.equal(firstCell.items[1].payload, 'ab');
      t.equal(firstCell.tokens[0].payload, 'ab');
      t.equal(firstCell.text, 'ab.c');
      const lastCell = sequence.cells[5];
      t.equal(lastCell.rows[0], 2);
      t.equal(lastCell.columns[0], 1);
      t.equal(lastCell.items[3].payload, 'hg');
      t.equal(lastCell.tokens[2].payload, 'hg');
      t.equal(lastCell.text, 'i hg');
    } catch (err) {
      console.log(err);
    }
  },
);
