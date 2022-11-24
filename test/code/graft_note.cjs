const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graft Notes';

const pk = pkWithDoc('../test_data/usfm/footnote.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/xref.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];

test(
  `Footnote (${testGroup})`,
  async function (t) {
    try {
      const expectedScopes = [
        ['s', 'inline/f'],
        ['s', 'span/ft'],
        ['e', 'span/ft'],
        ['s', 'span/fqa'],
        ['e', 'span/fqa'],
        ['s', 'span/ft'],
        ['e', 'span/ft'],
        ['s', 'span/fqa'],
        ['e', 'span/fqa'],
        ['s', 'span/ft'],
        ['e', 'span/ft'],
        ['e', 'inline/f'],
      ];
      t.plan(3 + (2 * expectedScopes.length));
      const query = `{ documents { sequences { id type blocks { dump items {type subType payload} } } mainSequence { id } } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = {};

      for (const seq of result.data.documents[0].sequences) {
        sequences[seq.id] = seq;
      }

      const mainSequence = sequences[result.data.documents[0].mainSequence.id];
      t.equal(mainSequence.blocks.length, 5);
      const footnoteCallerBlock = mainSequence.blocks[2];
      const footnoteGrafts = footnoteCallerBlock.items.filter(i => i.subType === 'footnote');
      t.equal(footnoteGrafts.length, 1);
      const footnoteItems = sequences[footnoteGrafts[0].payload].blocks[0].items;
      const scopes = footnoteItems.filter(i => i.type === 'scope');
      let count = 0;

      for (const [sOrE, expectedLabel] of expectedScopes) {
        t.equal(scopes[count].subType, sOrE === 's' ? 'start' : 'end');
        t.equal(scopes[count].payload, expectedLabel);
        count++;
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `XRef (${testGroup})`,
  async function (t) {
    try {
      const expectedScopes = [
        ['s', 'inline/x'],
        ['s', 'span/xo'],
        ['e', 'span/xo'],
        ['s', 'span/xt'],
        ['e', 'span/xt'],
        ['e', 'inline/x'],
      ];
      t.plan(3 + (2 * expectedScopes.length));
      const query = `{ documents { sequences { id type blocks { items {type subType payload} } } mainSequence { id } } }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequences = {};

      for (const seq of result.data.documents[0].sequences) {
        sequences[seq.id] = seq;
      }

      const mainSequence = sequences[result.data.documents[0].mainSequence.id];
      t.equal(mainSequence.blocks.length, 1);
      const xrefCallerBlock = mainSequence.blocks[0];
      const xrefGrafts = xrefCallerBlock.items.filter(i => i.subType === 'xref');
      t.equal(xrefGrafts.length, 1);
      const xrefItems = sequences[xrefGrafts[0].payload].blocks[0].items;
      const scopes = xrefItems.filter(i => i.type === 'scope');
      let count = 0;

      for (const [sOrE, expectedLabel] of expectedScopes) {
        t.equal(scopes[count].subType, sOrE === 's' ? 'start' : 'end');
        t.equal(scopes[count].payload, expectedLabel);
        count++;
      }
    } catch (err) {
      console.log(err);
    }
  },
);