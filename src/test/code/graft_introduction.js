const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graft Introduction';

const pk = pkWithDoc('../test_data/usx/not_nfc18_phm.usx', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/section_intros.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `One Introduction (${testGroup})`,
  async function (t) {
    try {
      t.plan(23);
      const query = '{ documents { sequences { id type blocks { bg { subType, sequenceId } bs { label } text } } mainSequence { id } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = {};
      for (const seq of result.data.documents[0].sequences) {
        sequences[seq.id] = seq;
      }
      const mainSequence = sequences[result.data.documents[0].mainSequence.id];
      t.equal(Object.keys(sequences).length, 8);
      t.equal(mainSequence.blocks[0].bg.length, 3);
      t.equal(mainSequence.blocks[0].bg[0].subType, 'title');
      t.equal(mainSequence.blocks[0].bg[1].subType, 'introduction');
      t.equal(mainSequence.blocks[0].bg[2].subType, 'heading');
      const introSequence = sequences[mainSequence.blocks[0].bg[1].sequenceId];
      t.equal(introSequence.blocks.length, 3);
      t.equal(introSequence.blocks[0].bs.label.split('/')[1], 'ip');
      const titleGraft = introSequence.blocks[0].bg[0];
      t.equal(titleGraft.subType, 'title');
      const titleSequence = sequences[titleGraft.sequenceId];
      t.equal(titleSequence.blocks.length, 3);
      t.equal(titleSequence.blocks[0].bs.label, 'blockTag/imt2');
      t.equal(titleSequence.blocks[1].bs.label, 'blockTag/imt3');
      t.equal(titleSequence.blocks[2].bs.label, 'blockTag/imt');
      t.equal(introSequence.blocks[1].bs.label.split('/')[1], 'ip');
      const headingGraft = introSequence.blocks[1].bg[0];
      t.equal(headingGraft.subType, 'heading');
      const headingSequence = sequences[headingGraft.sequenceId];
      t.equal(headingSequence.blocks.length, 1);
      t.equal(headingSequence.blocks[0].bs.label, 'blockTag/is');
      t.equal(introSequence.blocks[2].bs.label.split('/')[1], 'hangingGraft');
      const endTitleGraft = introSequence.blocks[2].bg[0];
      t.equal(endTitleGraft.subType, 'endTitle');
      const endTitleSequence = sequences[endTitleGraft.sequenceId];
      t.equal(endTitleSequence.blocks.length, 3);
      t.equal(endTitleSequence.blocks[0].bs.label, 'blockTag/imte2');
      t.equal(endTitleSequence.blocks[1].bs.label, 'blockTag/imte3');
      t.equal(endTitleSequence.blocks[2].bs.label, 'blockTag/imte');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `One Introduction (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const query = '{ documents { sequences { id type blocks { bg { subType, sequenceId } bs { label } text } } mainSequence { id } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = {};
      for (const seq of result.data.documents[0].sequences) {
        sequences[seq.id] = seq;
      }
      const mainSequence = sequences[result.data.documents[0].mainSequence.id];
      t.equal(Object.keys(sequences).length, 8);
      t.equal(mainSequence.blocks.length, 2);
      t.equal(mainSequence.blocks[0].bg.length, 1);
      t.equal(mainSequence.blocks[0].bg[0].subType, 'title');
      t.equal(mainSequence.blocks[1].bg.length, 6);
      t.equal(mainSequence.blocks[1].bg[2].subType, 'introduction');
      t.equal(sequences[mainSequence.blocks[1].bg[2].sequenceId].blocks.length, 2);
      t.equal(sequences[mainSequence.blocks[1].bg[2].sequenceId].blocks[0].bs.label, 'blockTag/ip');
      t.equal(mainSequence.blocks[1].bg[5].subType, 'introduction');
      t.equal(sequences[mainSequence.blocks[1].bg[5].sequenceId].blocks.length, 1);
      t.equal(sequences[mainSequence.blocks[1].bg[5].sequenceId].blocks[0].bs.label, 'blockTag/ip');
    } catch (err) {
      console.log(err);
    }
  },
);
