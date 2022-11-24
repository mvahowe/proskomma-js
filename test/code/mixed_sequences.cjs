const path = require('path');
const fse = require('fs-extra');
const test = require('tape');

const { pkWithDoc } = require('../lib/load');
const {
  blocksSpec2Query,
  tsvToInputBlock,
  treeToInputBlock,
} = require('../../src/util/blocksSpec');

const [pk, pkDoc] = pkWithDoc('../test_data/usfm/66-JUD-ust.usfm', {
  lang: 'eng',
  abbr: 'ust',
});

const testGroup = 'Mixed Sequences';

test(
  `TN Table mutation (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const tableQuery = blocksSpec2Query(
        tsvToInputBlock(
          fse.readFileSync(path.resolve(__dirname, '../test_data/tsv/en_tn_66-JUD.tsv')).toString(),
        ),
      );

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "table"` +
        ` blocksSpec: ${tableQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSeqId = result.data.newSequence;
      query = `mutation { addSequenceTags(docSetId: "eng_ust", documentId: "${pkDoc.id}", sequenceId: "${newSeqId}", tags: ["tnotes"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `TWL Table mutation (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const tableQuery = blocksSpec2Query(
        tsvToInputBlock(
          fse.readFileSync(path.resolve(__dirname, '../test_data/tsv/twl_JUD.tsv')).toString(),
        ),
      );

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "table"` +
        ` blocksSpec: ${tableQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSeqId = result.data.newSequence;
      query = `mutation { addSequenceTags(docSetId: "eng_ust", documentId: "${pkDoc.id}", sequenceId: "${newSeqId}", tags: ["twords"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Tree mutation (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const treeQuery = blocksSpec2Query(
        treeToInputBlock(
          fse.readJSONSync(path.resolve(__dirname, '../test_data/tree/jude.json')),
        ),
      );

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "tree"` +
        ` blocksSpec: ${treeQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSeqId = result.data.newSequence;
      query = `mutation { addSequenceTags(docSetId: "eng_ust", documentId: "${pkDoc.id}", sequenceId: "${newSeqId}", tags: ["stree"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `kv mutation (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const kvQuery = blocksSpec2Query(
        fse.readJSONSync(path.resolve(__dirname, '../test_data/inputBlockSpec/kv.json')),
      );

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "kv"` +
        ` blocksSpec: ${kvQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const newSeqId = result.data.newSequence;
      query = `mutation { addSequenceTags(docSetId: "eng_ust", documentId: "${pkDoc.id}", sequenceId: "${newSeqId}", tags: ["kv"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `As vanilla sequences (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query = '{documents { mainSequence { id } sequences { id type tags blocks { bs { payload} bg { payload } is { payload } tokens { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);

      for (const sType of ['main', 'title', 'table', 'tree', 'kv']) {
        t.ok(result.data.documents[0].sequences.map(s => s.type).includes(sType));
      }
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
      t.plan(1);
      const bookN = 65;
      const chapterN = 1;
      const verseN = 23;

      const padInt = n => {
        const padded = `00${n}`;
        return padded.substring(padded.length -3);
      };

      const query = `{
        docSets {
          document(bookCode:"JUD") {
            cv (chapter:"${chapterN}" verses:["${verseN}"]) { tokens {subType payload scopes} }
            tnTable: tableSequences(withTags:"tnotes") { tags rows(equals:[{colN:1 values:"${chapterN}"}, {colN:2 values:"${verseN}"}] columns:[3, 4, 5, 6, 7, 8]) { text } }
            twlTable: tableSequences(withTags:"twords") { tags rows(equals:[{colN:0 values:"${chapterN}:${verseN}"}] columns:[1, 2, 3, 4, 5]) { text } }
            kv: kvSequences(withTags:"kv") { nEntries, entries(secondaryEquals:[{key:"service", values:"dessert"}, {key:"color", values:"green"}]) { key secondaryKeys { key value } itemGroups { scopeLabels(startsWith:"kvField") text } } }
            sTree: treeSequences(withTags:"stree") {
              tribos(
                query:"nodes[and(==(content('elementType'), 'Node'), startsWith(content('morphId'), '${bookN}${padInt(chapterN)}${padInt(verseN)}'))]/node{@Cat, @text, @English}"
              )
            }
          }
      }}`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);

      // const document = result.data.docSets[0].document;
      // const scripture = document.cv[0].tokens;
      // const tNotes = document.tnTable[0].rows.map(r => r.map(c => c.text));
      // const tWords = document.twlTable[0].rows.map(r => r.map(c => c.text));
      // const sTree = JSON.parse(document.sTree[0].tribos).data.map(n => n.content);
      /*
      const cleanKV = entry => {
        const fields = {};
        entry.itemGroups.forEach(ig => fields[ig.scopeLabels[0].split('/')[1]] = ig.text);
        const secondaryKeys = {};
        entry.secondaryKeys.forEach(k => secondaryKeys[k.key] = k.value);
        return {
          key: entry.key,
          secondaryKeys,
          fields,
        };
      };
      const kv = document.kv[0].entries.map(kv => cleanKV(kv));

      console.log(
        JSON.stringify({
          scripture,
          sTree,
          tNotes,
          tWords,
          kv,
        },
        null,
        2));
       */
    } catch (err) {
      console.log(err);
    }
  },
);
