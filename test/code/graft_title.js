const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graft Title';

const pk = pkWithDoc('../test_data/usx/not_nfc18_phm.usx', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Title (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const query = '{ documents { sequences { id type blocks { bg { subType, payload } bs { payload } text } } mainSequence { id } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = result.data.documents[0].sequences;
      const mainSequence = sequences.filter(s => s.id === result.data.documents[0].mainSequence.id)[0];
      t.equal(mainSequence.blocks[0].bg[0].subType, 'title');
      const titleSequence = sequences.filter(s => s.id === mainSequence.blocks[0].bg[0].payload)[0];
      t.equal(titleSequence.blocks.length, 2);
      t.equal(titleSequence.blocks[0].bs.payload.split('/')[1], 'mt2');
      t.equal(titleSequence.blocks[1].bs.payload.split('/')[1], 'mt');
      t.equal(mainSequence.blocks[1].bg[0].subType, 'endTitle');
      const endTitleSequence = sequences.filter(s => s.id === mainSequence.blocks[1].bg[0].payload)[0];
      t.equal(endTitleSequence.blocks.length, 2);
      t.equal(endTitleSequence.blocks[0].bs.payload.split('/')[1], 'mte2');
      t.equal(endTitleSequence.blocks[1].bs.payload.split('/')[1], 'mte');
    } catch (err) {
      console.log(err);
    }
  },
);