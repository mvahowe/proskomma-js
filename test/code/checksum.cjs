const test = require('tape');

const { pkWithDocs } = require('../lib/load');

const testGroup = 'Checksum';

test(
  `4 docs in 3 docSets (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      const pk = pkWithDocs([
        ['../test_data/usx/web_psa150.usx', {
          lang: 'eng',
          abbr: 'webbe',
        }],
        ['../test_data/usx/web_rut.usx', {
          lang: 'eng',
          abbr: 'webbe',
        }],
        ['../test_data/usfm/ust_psa.usfm', {
          lang: 'eng',
          abbr: 'ust',
        }],
        ['../test_data/usx/not_nfc18_phm.usx', {
          lang: 'eng',
          abbr: 'nnfc18',
        }],
      ]);
      const cs = pk.checksum();
      t.ok(cs);
    } catch (err) {
      console.log(err);
    }
  },
);
