const test = require('tape');
const {
  pkWithDoc,
} = require('../lib/load');

const testGroup = 'Mutate Update Operations';

test(
  `Items (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
        lang: 'eng',
        abbr: 'ust',
      }, {}, {}, [], [])[0];
      const query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { itemObjects { type subType payload } } } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      const docSet = result.data.docSets[0];
      const document = docSet.documents[0];
      const sequence = document.mainSequence;
      const block = sequence.blocks[0];
      const itemObjects = block.itemObjects;
      // console.log(itemObjects);
    } catch (err) {
      console.log(err);
    }
  },
);
