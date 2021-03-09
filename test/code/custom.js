const test = require('tape');

const { ProsKomma } = require('../../src');
const {
  pkWithDoc,
  customPkWithDoc,
} = require('../lib/load');

const testGroup = 'Custom Tags';

const pk = pkWithDoc('../test_data/usfm/custom.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

const customProsKomma = class extends ProsKomma {

  constructor() {
    super();
    this.filters = {};
    this.customTags = {
      heading: ['zh'],
      paragraph: ['zp'],
      char: ['zc'],
      word: ['zw'],
      intro: ['zhi', 'zip'],
      introHeading: ['zhi'],
    };
  }

};

const customPk = customPkWithDoc(customProsKomma, '../test_data/usfm/custom.usfm', {
  lang: 'fra',
  abbr: 'hello',
}, {})[0];

const query = `{ documents { sequences { id type blocks { scopeLabels bs { payload } bg { subType, payload } items {type subType payload} } } } }`;

test(
  `Unknown Tags (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = result.data.documents[0].sequences;
      t.equal(sequences.length, 3);
      const mainSequence = sequences.filter(s => s.type === 'main')[0];
      t.equal(mainSequence.blocks.length, 1);
      t.equal(mainSequence.blocks[0].items.filter(i => i.payload === 'Custom').length, 1);
      t.equal(mainSequence.blocks[0].items.filter(i => i.subType === 'unknown' && i.payload.startsWith('|')).length, 1);
      const introSequence = sequences.filter(s => s.type === 'introduction')[0];
      t.equal(introSequence.blocks.length, 1);
      t.equal(introSequence.blocks[0].items.filter(i => i.payload === 'Custom').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Declared Tags (${testGroup})`,
  async function (t) {
    try {
      t.plan(15);
      const result = await customPk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = result.data.documents[0].sequences;
      const mainSequence = sequences.filter(s => s.type === 'main')[0];
      t.equal(mainSequence.blocks.length, 2);
      t.equal(mainSequence.blocks[0].items.filter(i => i.payload === 'Custom').length, 0);
      t.equal(mainSequence.blocks[1].items.filter(i => i.payload === 'Custom').length, 0);
      t.equal(mainSequence.blocks[1].items.filter(i => i.subType === 'unknown').length, 0);
      t.equal(mainSequence.blocks[0].bs.payload, 'blockTag/p');
      t.equal(mainSequence.blocks[1].bs.payload, 'blockTag/zp');
      for (const label of ['span/zc', 'spanWithAtts/zw', 'attribute/spanWithAtts/zw/x-foo/0/baa']) {
        t.ok(mainSequence.blocks[1].scopeLabels.includes(label));
      }
      const introSequence = sequences.filter(s => s.type === 'introduction')[0];
      t.equal(introSequence.blocks.length, 2);
      t.equal(introSequence.blocks[0].bs.payload, 'blockTag/ip');
      t.equal(introSequence.blocks[1].bs.payload, 'blockTag/zip');
      t.equal(sequences.filter(s => s.type === 'heading' && s.blocks[0].bs.payload === 'blockTag/zh').length, 1);
      t.equal(sequences.filter(s => s.type === 'heading' && s.blocks[0].bs.payload === 'blockTag/zhi').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);