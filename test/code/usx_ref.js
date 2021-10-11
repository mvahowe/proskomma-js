const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'USX Ref';

const [pk, doc] = pkWithDoc('../test_data/usx/esg3.usx', {
  lang: 'fra',
  abbr: 'nfc18',
});

test(
  `Render xt (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query =
        '{ documents { cv(chapter:"3" verses:"1") { items { type subType payload } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const seqId = result.data.documents[0].cv[0].items.filter(i => i.type === 'graft' && i.subType === 'footnote')[0].payload;

      query = `{
      document(id:"${doc.id}") {
        sequence(id:"${seqId}") {
          blocks { text(normalizeSpace:true) }
        }
      }
    }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok(result.data.document.sequence.blocks[0].text.includes('1.2-3'));
    } catch (err) {
      console.log(err);
    }
  },
);

