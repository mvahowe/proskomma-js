const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph Item Groups';

const pk = pkWithDoc('../test_data/usfm/verse_breaks_in_blocks.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/ust_psa_with_ts.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk3 = pkWithDoc('../test_data/usx/web_psa.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `Text by scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      const query = '{ documents { mainSequence { itemGroups(byScopes:["chapter/", "verse/"] includeContext:true) {' +
        'scopeLabels text dump' +
        '} } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      // console.log(JSON.stringify(result.data.documents[0].mainSequence.itemGroups[1], null, 2))
      const itemGroups = result.data.documents[0].mainSequence.itemGroups;
      t.equal(itemGroups.length, 3);
      t.equal(itemGroups[1].scopeLabels.length, 3);
      t.ok(itemGroups[1].scopeLabels.includes('chapter/1'));
      t.ok(itemGroups[1].scopeLabels.includes('verse/2'));
      t.ok(itemGroups[1].scopeLabels.includes('blockTag/q'));
      t.ok(itemGroups[1].text.startsWith('Instead'));
      t.ok(itemGroups[1].text.trim().endsWith('Yahweh teaches.')); // trim cos trailing newline before next \v
      const dumped = itemGroups[1].dump.split('\n').map(l => l.trim());
      t.ok(dumped[0].startsWith('ItemGroup'));
      t.ok(dumped[1].includes('verse/2'));
      t.ok(dumped[2].startsWith('+verse/2+'));
      t.ok(dumped[4].endsWith('-verse/2-'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Items & tokens by scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      const query = '{ documents { mainSequence { itemGroups(byScopes:["chapter/", "verse/"]) {' +
        'scopeLabels ' +
        `items {type subType payload position scopes } ` +
        'tokens { payload }' +
        '} } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const itemGroups = result.data.documents[0].mainSequence.itemGroups;
      t.equal(itemGroups.length, 3);
      t.equal(itemGroups[1].scopeLabels.length, 3);
      t.equal(itemGroups[1].items.filter(i => i.type === 'token')[0].payload, 'Instead');
      t.equal(itemGroups[1].items.filter(i => i.type === 'token').reverse()[1].payload, '.'); // Trailing newline before next \v
      t.equal(itemGroups[1].tokens[0].payload, 'Instead');
      t.equal([...itemGroups[1].tokens].reverse()[1].payload, '.'); // Leading newline (before reversal)
      t.equal(itemGroups[0].items.filter(i => i.type === 'graft').length, 1);
      t.equal(itemGroups[1].items.filter(i => i.subType === 'start' && i.payload === 'blockTag/q2').length, 0);
      t.equal(itemGroups[2].items.filter(i => i.subType === 'start' && i.payload === 'blockTag/q2').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Text by scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const query = '{ documents { mainSequence { itemGroups(byMilestones:["milestone/ts"]) {' +
        'scopeLabels text normalized: text(normalizeSpace:true)' +
        '} } } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const itemGroups = result.data.documents[0].mainSequence.itemGroups;
      t.equal(itemGroups.length, 3);
      t.ok(itemGroups[0].scopeLabels.includes('chapter/150'));
      t.ok(itemGroups[0].scopeLabels.includes('verse/1'));
      t.ok(!itemGroups[1].scopeLabels.includes('verse/1'));
      t.ok(itemGroups[1].text.trim().startsWith('Praise'));
      t.ok(itemGroups[1].text.trim().endsWith('cymbals!'));
      t.equal(itemGroups[0].text.split('\n').length, 5);
      t.equal(itemGroups[0].normalized.split('\n').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);
