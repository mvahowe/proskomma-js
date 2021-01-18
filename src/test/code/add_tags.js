const test = require('tape');
const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], ['frob'])[0];

const testGroup = 'Add Tags';

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      let query = '{ docSets { id tags } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docSet = result.data.docSets[0];
      t.equal(docSet.tags.length, 0);
      query = `mutation { addDocSetTags(docSetId: "${docSet.id}", tags: ["foo", "baa"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addDocSetTags.length, 2);
      query = `mutation { addDocSetTags(docSetId: "${docSet.id}", tags: ["foo", "frob"]) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.data.addDocSetTags.length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);