const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const { Proskomma } = require('../../src');

const testGroup = 'importUsfmInt';

test(
  `Import (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const pk = new Proskomma();
      let fp = '../test_data/usfm/cp_vp.usfm';
      let content = fse.readFileSync(path.resolve(__dirname, fp));

      t.throws(() =>
        pk.importUsfmPeriph(
          { lang: 'eng', abbr: 'abc' },
          content,
          {},
        ),
      /INT.+ESG/);
      fp = '../test_data/usfm/int.usfm';
      content = fse.readFileSync(path.resolve(__dirname, fp));

      t.doesNotThrow(() =>
        pk.importUsfmPeriph(
          { lang: 'eng', abbr: 'abc' },
          content,
          {},
        ));
      t.equal(pk.nDocuments(), 2);
      const query = '{documents { headers { key value } sequences { type text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const firstDoc = result.data.documents[0];
      const headerKeys = firstDoc.headers.map(h => h.key);
      t.ok(headerKeys.includes('id'));
      t.ok(headerKeys.includes('bookCode'));
      t.equal(firstDoc.headers.filter(h => h.key === 'bookCode')[0].value, 'P00');
      const introSequence = firstDoc.sequences.filter(s => s.type === 'introduction')[0];
      t.equal(introSequence.text, 'The Bible is a book of books.');
    } catch (err) {
      console.log(err);
    }
  },
);
