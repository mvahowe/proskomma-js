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
      let query = '{documents { mainSequence { id } sequences { id type tags blocks { bs { payload} bg { payload } is { payload } tokens { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const doc = result.data.documents[0];
      const mainSequence = doc.sequences.filter(s => s.id === doc.mainSequence.id)[0];
      const tableGraft = mainSequence.blocks[0].bg[0].payload;
      const tableSequence = doc.sequences.filter(s => s.id === tableGraft)[0];
      t.equal(tableSequence.type, 'table');
      t.equal(tableSequence.tags.length, 2);
      t.equal(tableSequence.tags[0], 'col0:firstCol');
      t.equal(tableSequence.blocks.length, 6);
      t.equal(tableSequence.blocks.filter(b => b.bs.payload === 'tTableRow/1').length, 2);
      t.equal(tableSequence.blocks.filter(b => b.is.map(s => s.payload).includes('tTableCol/1')).length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Query Cells (${testGroup})`,
  async function (t) {
    try {
      t.plan(16);
      const pk = new Proskomma();
      importTSV(pk);
      let query = '{docSets { document(bookCode:"T00") { sequences(types:"table") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tableSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{docSets { document(bookCode:"T00") { tableSequence(id:"${tableSequenceId}") { nCells nRows nColumns cells { rows columns items { payload } tokens { payload } text } } } } }`;
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

test(
  `Query Rows (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const pk = new Proskomma();
      importTSV(pk);
      let query = '{docSets { document(bookCode:"T00") { sequences(types:"table") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tableSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{docSets { document(bookCode:"T00") { tableSequence(id:"${tableSequenceId}") { rows { columns text } } } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequenceRows = result.data.docSets[0].document.tableSequence.rows;
      t.equal(sequenceRows.length, 3);
      t.equal(sequenceRows[0].length, 2);
      t.equal(sequenceRows[0][1].columns[0], 1);
      t.equal(sequenceRows[0][1].text, 'c ba');
      t.equal(sequenceRows[2].length, 2);
      t.equal(sequenceRows[2][0].columns[0], 0);
      t.equal(sequenceRows[2][0].text, 'gh.i');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Headings (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const pk = new Proskomma();
      importTSV(pk);
      let query = '{docSets { document(bookCode:"T00") { sequences(types:"table") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tableSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{docSets { document(bookCode:"T00") { tableSequence(id:"${tableSequenceId}") { headings } } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const headings = result.data.docSets[0].document.tableSequence.headings;
      t.equal(headings.length, 2);
      t.equal(headings[0], 'firstCol');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter Rows (${testGroup})`,
  async function (t) {
    try {
      t.plan(11);
      const pk = new Proskomma();
      importTSV(pk);
      let query = '{docSets { document(bookCode:"T00") { sequences(types:"table") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tableSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{docSets { document(bookCode:"T00") { tableSequence(id:"${tableSequenceId}") { rows(positions:[0, 2]) { text } } } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let sequenceRows = result.data.docSets[0].document.tableSequence.rows;
      t.equal(sequenceRows.length, 2);
      t.equal(sequenceRows[0][0].text, 'ab.c');
      t.equal(sequenceRows[1][0].text, 'gh.i');
      query = `{docSets { document(bookCode:"T00") { tableSequence(id:"${tableSequenceId}") { rows(matches:[{colN:0 matching:"ab|de"},{colN:1 matching:"ba|gh"}]) { text } } } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      sequenceRows = result.data.docSets[0].document.tableSequence.rows;
      t.equal(sequenceRows.length, 1);
      t.equal(sequenceRows[0][0].text, 'ab.c');
      query = `{docSets { document(bookCode:"T00") { tableSequence(id:"${tableSequenceId}") { rows(equals:[{colN:0 values:["de.f", "ab.c"]},{colN:1 values:["i hg", "f ed"]}]) { text } } } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      sequenceRows = result.data.docSets[0].document.tableSequence.rows;
      t.equal(sequenceRows.length, 1);
      t.equal(sequenceRows[0][0].text, 'de.f');
    } catch (err) {
      console.log(err);
    }
  },
);
