const path = require('path');
const fse = require('fs-extra');
const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usfm/66-JUD-ust.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];

const tsvToTable = (tsv, hasHeadings) => {
  const ret = {
    headings: [],
    rows: [],
  };
  let rows = tsv.split(/[\n\r]+/);

  if (hasHeadings) {
    ret.headings = rows[0].split('\t');
    rows = rows.slice(1);
  }

  for (const row of rows) {
    ret.rows.push(row.split('\t'));
  }
  return ret;
};

const importTSV = (pk, tsvPath, hasHeadings) => {
  pk.importDocument({
    lang: 'eng',
    abbr: 'ust',
  }, 'tsv',
  JSON.stringify(
    tsvToTable(
      fse.readFileSync(
        path.resolve(__dirname, tsvPath),
      )
        .toString(),
      hasHeadings,
    ),
    {},
  ),
  null,
  2,
  );
};

const importNodes = pk => {
  pk.importDocument({
    lang: 'eng',
    abbr: 'ust',
  }, 'nodes',
  fse.readFileSync(path.resolve(__dirname, '../test_data/tree/jude.json')),
  {},
  );
};

importNodes(pk);
importTSV(pk, '../test_data/tsv/en_tn_66-JUD.tsv', true);

const testGroup = 'Mixed Sequences';

test(
  `As vanilla sequences (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      let query = '{documents { mainSequence { id } sequences { id type tags blocks { bs { payload} bg { payload } is { payload } tokens { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `As cast sequences (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      let query = `{
      docSets {
        tableDoc: document(bookCode:"T00") { sequences(types:"table") { id } }
        treeDoc: document(bookCode:"N00") { sequences(types:"tree") { id } }
        }
      }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tableSequenceId = result.data.docSets[0].tableDoc.sequences[0].id;
      const treeSequenceId = result.data.docSets[0].treeDoc.sequences[0].id;
      const bookN = 65;
      const chapterN = 1;
      const verseN = 23;

      const padInt = n => {
        const padded = `00${n}`;
        return padded.substring(padded.length -3);
      };

      query = `{
        docSets {
          scripture: document(bookCode:"JUD") {
            cv (chapter:"${chapterN}" verses:["${verseN}"]) { text(normalizeSpace:true) }
          }
          table: document(bookCode:"T00") {
            tableSequence(id:"${tableSequenceId}") { rows(equals:[{colN:1 values:"${chapterN}"}, {colN:2 values:"${verseN}"}] columns:[3, 4, 5, 6, 7, 8]) { text } }
          }
          tree: document(bookCode:"N00") {
            treeSequence(id:"${treeSequenceId}") {
              tribos(
                query:"nodes[and(==(content('elementType'), 'Node'), startsWith(content('morphId'), '${bookN}${padInt(chapterN)}${padInt(verseN)}'))]/node{@Cat, @text, @English}") }
          }
      }}`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      /*
      const docSet = result.data.docSets[0];
      const scripture = docSet.scripture.cv[0].text;
      const table = docSet.table.tableSequence.rows.map(r => r.map(c => c.text));
      const tree = JSON.parse(docSet.tree.treeSequence.tribos).data.map(n => n.content);

      console.log(
        JSON.stringify({
          scripture,
          table,
          tree,
        },
        null,
        2));*/
    } catch (err) {
      console.log(err);
    }
  },
);
