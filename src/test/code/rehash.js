const test = require('tape');
const { pkWithDoc } = require('../lib/load');

const [pk, doc] = pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], []);

const testGroup = 'Rehash';

test(
  `One Document (${testGroup})`,
  async function (t) {
    try {
      pk.docSets[doc.docSetId].rehash();
    } catch (err) {
      console.log(err);
    }
  },
);