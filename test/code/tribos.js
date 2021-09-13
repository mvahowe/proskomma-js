const path = require('path');
const test = require('tape');

const fse = require('fs-extra');
const { Proskomma } = require('../../src');

const importNodes = pk => {
  pk.importDocument({
    lang: 'deu',
    abbr: 'xyz',
  }, 'nodes',
  fse.readFileSync(path.resolve(__dirname, '../test_data/tree/genealogy.json')),
  {},
  );
};

const testGroup = 'Tribos';

test(
  `Absolute references (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const pk = new Proskomma();
      importNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{2, 3}") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);
