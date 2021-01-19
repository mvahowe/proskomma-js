const test = require('tape');
const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], [])[0];

const testGroup = 'Mutate Delete Operations';

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
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
      query = '{ docSets { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.data.docSets.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);