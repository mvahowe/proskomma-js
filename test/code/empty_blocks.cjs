const test = require('tape');

const { Proskomma } = require('../../src');
const {
  pkWithDoc,
  customPkWithDoc,
} = require('../lib/load');

const testGroup = 'Empty Blocks';

const pk = pkWithDoc('../test_data/usfm/en_ust_psa_1.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

const customProskomma = class extends Proskomma {
  constructor() {
    super();
    this.filters = {};
    this.customTags = {
      heading: [],
      paragraph: [],
      char: [],
      word: [],
      intro: [],
      introHeading: [],
    };
    this.emptyBlocks = ['blockTag/s5', 'blockTag/m'];
  }
};

const customPk = customPkWithDoc(customProskomma, '../test_data/usfm/en_ust_psa_1.usfm', {
  lang: 'fra',
  abbr: 'hello',
}, {})[0];

const query = `{ documents { sequences { type blocks { bg { subType payload } bs { payload } text } } } }`;

test(
  `Without Custom (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = result.data.documents[0].sequences;
      // t.equal(sequences.filter(s => s.type === 'heading').length, 0);
      // BEHAVIOUR CHANGED WITH SUCCINCT FILTER. s5 sequences are empty but not deleted
      t.equal(sequences.filter(s => s.type === 'main')[0].blocks[0].bs.payload, 'blockTag/q');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `With Custom (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const result = await customPk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = result.data.documents[0].sequences;
      t.equal(sequences.filter(s => s.type === 'heading').length, 3);
      t.equal(sequences.filter(s => s.type === 'heading' && s.blocks[0].bs.payload === 'blockTag/s5').length, 3);
      t.equal(sequences.filter(s => s.type === 'main')[0].blocks[0].bs.payload, 'blockTag/m');
    } catch (err) {
      console.log(err);
    }
  },
);
