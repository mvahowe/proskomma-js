const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Pub Numbers';

const pk = pkWithDoc('../test_data/usfm/cp_vp.usfm', {
  lang: 'fra',
  abbr: 'hello',
})[0];
const pk2 = pkWithDoc('../test_data/usx/cp_vp.usx', {
  lang: 'fra',
  abbr: 'hello',
})[0];

const pk3 = pkWithDoc('../test_data/usx/esg3.usx', {
  lang: 'fra',
  abbr: 'nfc18',
})[0];

test(
  `USFM (${testGroup})`,
  async function (t) {
    try {
      const expectedScopes = [
        ['s', 'chapter/3'],
        ['s', 'pubChapter/B'],
        ['s', 'verse/14'],
        ['s', 'verses/14'],
        ['s', 'pubVerse/1b'],
        ['e', 'pubVerse/1b'],
        ['e', 'verses/14'],
        ['e', 'verse/14'],
        ['s', 'verse/15'],
        ['s', 'verses/15'],
        ['s', 'pubVerse/2b'],
        ['e', 'pubVerse/2b'],
        ['e', 'verses/15'],
        ['e', 'verse/15'],
        ['e', 'pubChapter/B'],
        ['s', 'pubChapter/3bis'],
        ['s', 'pubVerse/1'],
        ['e', 'pubVerse/1'],
        ['e', 'pubChapter/3bis'],
        ['e', 'chapter/3'],
      ];
      t.plan(1 + (expectedScopes.length * 2));
      const query =
        '{ documents { mainSequence { blocks { items { type subType payload } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const scopes = result.data.documents[0].mainSequence.blocks[0].items.filter(i => i.type === 'scope');
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
  `USX (${testGroup})`,
  async function (t) {
    try {
      const expectedScopes = [
        ['s', 'chapter/1'],
        ['s', 'pubChapter/A'],
        ['s', 'altChapter/(A)'],
        ['s', 'verse/1'],
        ['s', 'verse/2'],
        ['s', 'verses/1-2'],
        ['s', 'pubVerse/1-2'],
        ['s', 'altVerse/1, 2'],
        ['e', 'altVerse/1, 2'],
        ['e', 'pubVerse/1-2'],
        ['e', 'verses/1-2'],
        ['e', 'verse/2'],
        ['e', 'verse/1'],
        ['s', 'verse/3'],
        ['s', 'verses/3'],
        ['s', 'altVerse/(3)'],
        ['e', 'altVerse/(3)'],
        ['e', 'verses/3'],
        ['e', 'verse/3'],
        ['e', 'altChapter/(A)'],
        ['e', 'pubChapter/A'],
        ['e', 'chapter/1'],
      ];
      t.plan(1 + (2 * expectedScopes.length));
      const query =
        '{ documents { mainSequence { blocks { items { type subType payload } } } } }';
      const result = await pk2.gqlQuery(query);
      // console.log(JSON.stringify(result.data, null, 2))
      t.equal(result.errors, undefined);
      const scopes = result.data.documents[0].mainSequence.blocks[0].items.filter(i => i.type === 'scope');
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
  `ESG USX (${testGroup})`,
  async function (t) {
    try {
      const expectedScopes = [
        ['s', 'chapter/3'],
        ['s', 'verse/1'],
        ['s', 'verses/1'],
        ['s', 'pubVerse/1'],
        ['e', 'pubVerse/1'],
        ['e', 'verses/1'],
        ['e', 'verse/1'],
        ['s', 'verse/2'],
        ['s', 'verses/2'],
        ['s', 'pubVerse/2'],
        ['e', 'pubVerse/2'],
        ['e', 'verses/2'],
        ['e', 'verse/2'],
        ['s', 'pubChapter/B'],
        ['s', 'verse/14'],
        ['s', 'verses/14'],
        ['s', 'pubVerse/1'],
        ['e', 'pubVerse/1'],
        ['e', 'verses/14'],
        ['e', 'verse/14'],
        ['e', 'pubChapter/B'],
      ];
      t.plan(1 + (2 * expectedScopes.length));
      const query =
        '{ documents { mainSequence { blocks { items { type subType payload } } } } }';
      const result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      const scopes = result.data.documents[0].mainSequence.blocks.map(b => b.items.filter(i => i.type === 'scope')).reduce((a, b) => a.concat(b));
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
