const util = require('util');
const test = require('tape');
const deepCopy = require('deep-copy-all');
const deepEqual = require('deep-equal');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Modify Sequence Method';

const pk = pkWithDoc('../test_data/usfm/hello.usfm', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `Identity Transform (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const myPk = deepCopy(pk);
      const document = Object.values(myPk.documents)[0];
      const oldSequence = deepCopy(document.sequences[document.mainId]);
      document.modifySequence(oldSequence.id);
      const newSequence = document.sequences[document.mainId];
      t.ok(deepEqual(oldSequence, newSequence));
    } catch (err) {
      console.log(err);
    }
  },
);