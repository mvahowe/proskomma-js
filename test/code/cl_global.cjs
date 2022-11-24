const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Global CL';

const [pk] = pkWithDoc('../test_data/usfm/cl.usfm', {
  lang: 'eng',
  abbr: 'ult',
});

test(
  `Global CL (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ documents { headers { key value } sequences { type blocks { text } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const titleSequence = result.data.documents[0].sequences.filter(s => s.type === 'title')[0];
      t.equal(titleSequence.blocks.length, 1);
      t.equal(titleSequence.blocks[0].text, 'Psalms');
      const headersArray = result.data.documents[0].headers;
      const headers = {};

      for (const header of headersArray) {
        headers[header.key] = header.value;
      }
      t.ok('cl' in headers);
      t.equal(headers.cl, 'Psalm');
    } catch (err) {
      console.log(err);
    }
  },
);
