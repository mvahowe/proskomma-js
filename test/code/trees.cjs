const path = require('path');
const fse = require('fs-extra');
const test = require('tape');

const { Validator } = require('jsonschema');
const { pkWithDoc } = require('../lib/load');
const { Proskomma } = require('../../src');
const {
  blocksSpec2Query,
  treeToInputBlock,
} = require('../../src/util/blocksSpec');
const { utils } = require('../../dist/index');
const serializedSchema = utils.proskommaSerialized;

const [pk, pkDoc] = pkWithDoc('../test_data/usfm/66-JUD-ust.usfm', {
  lang: 'eng',
  abbr: 'ust',
});

const importNodes = pk => {
  pk.importDocument({
    lang: 'deu',
    abbr: 'xyz',
  }, 'nodes',
  fse.readFileSync(path.resolve(__dirname, '../test_data/tree/genealogy.json')),
  {},
  );
};

const testGroup = 'Trees';

test(
  `Return error for treeSequence on non-tree sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query = '{documents { id mainSequence { id } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docId = result.data.documents[0].id;
      const seqId = result.data.documents[0].mainSequence.id;
      query = `{document(id:"${docId}") { treeSequence(id:"${seqId}") { id } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.includes('type \'tree\', not \'main\''));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Import (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const pk = new Proskomma();
      importNodes(pk);
      let query = '{documents { mainSequence { id } sequences { id type tags blocks { bs { payload} bg { payload } is { payload } items { type subType payload } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const doc = result.data.documents[0];
      const mainSequence = doc.sequences.filter(s => s.id === doc.mainSequence.id)[0];
      const treeGraft = mainSequence.blocks[0].bg[0].payload;
      const treeSequence = doc.sequences.filter(s => s.id === treeGraft)[0];
      t.equal(treeSequence.type, 'tree');
      t.equal(treeSequence.blocks.length, 7);
      t.equal(treeSequence.blocks[0].bs.payload, 'tTreeNode/0');
      const nodeChildren = treeSequence.blocks[0].is.filter(s => s.payload.startsWith('tTreeChild')).map(s => s.payload);
      t.equal(nodeChildren.length, 2);
      const nodeParent = treeSequence.blocks[0].is.filter(s => s.payload.startsWith('tTreeParent')).map(s => s.payload);
      t.equal(nodeParent.length, 1);
      t.equal(nodeParent[0], 'tTreeParent/none');
      const nodeName = treeSequence.blocks[0].is.filter(s => s.payload.startsWith('tTreeContent/name')).map(s => s.payload);
      t.equal(nodeName.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `treeSequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const pk = new Proskomma();
      importNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{
        docSets {
          document(bookCode:"N00") {
            treeSequence(id:"${treeSequenceId}") {
             id
             nNodes
             nodes {
               id
               parentId
               childIds
               keys
               itemGroups {
                 scopeLabels(startsWith:"tTreeContent")
                 text
               }
             }
            }
          }
        }
      }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequence = result.data.docSets[0].document.treeSequence;
      t.equal(treeSequence.nNodes, 7);
      t.equal(treeSequence.nodes[0].parentId, null);
      t.equal(treeSequence.nodes[1].parentId, treeSequence.nodes[0].id);
      t.equal(treeSequence.nodes[0].childIds.length, 2);
      t.equal(treeSequence.nodes[0].childIds[0], '1');
      t.equal(treeSequence.nodes[0].childIds[1], '4');
      t.equal(treeSequence.nodes[0].keys.length, 3);
      t.equal(treeSequence.nodes[0].itemGroups.length, 3);
      t.equal(treeSequence.nodes[0].itemGroups[0].text, 'me');
      t.equal(treeSequence.nodes[0].itemGroups[0].scopeLabels[0].split('/')[1], 'label');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Import and query tree JSON as sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);

      const blockQuery = blocksSpec2Query(
        treeToInputBlock(
          fse.readJSONSync(path.resolve(__dirname, '../test_data/tree/jude.json')),
        ),
      );

      // console.log(blockQuery);

      let query = `mutation { newSequence(` +
        ` documentId: "${pkDoc.id}"` +
        ` type: "tree"` +
        ` blocksSpec: ${blockQuery}` +
        ` graftToMain: true) }`;

      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);

      query = `{
      docSets {
        documents {
          treeSequences {
             id
             nNodes
             nodes {
               id
               parentId
               childIds
               keys
               itemGroups {
                 scopeLabels(startsWith:"tTreeContent")
                 text
               }
             }

          }
        }
      }}`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const node = result.data.docSets[0].documents[0].treeSequences[0].nodes[13];
      t.equal(node.id, '13');
      t.equal(node.parentId, '12');
      t.equal(node.childIds.length, 1);
      t.equal(node.childIds[0], '14');
      t.equal(node.itemGroups.filter(ig => ig.scopeLabels[0] === 'tTreeContent/English')[0].text, 'of Jesus');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Serialize (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const pk = new Proskomma();
      importNodes(pk);
      const query = '{ docSets { id } }';
      const result = await pk.gqlQuery(query);
      const docSetId = result.data.docSets[0].id;
      const serialized = pk.serializeSuccinct(docSetId);
      t.ok(serialized);
      const validationReport = new Validator().validate(serialized, serializedSchema);
      t.equal(validationReport.errors.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
