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

test(
  `Text by scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const query = '{ documents { mainSequence { itemGroups(byScopes:["chapter/", "verse/"]) {' +
        'scopeLabels text ' +
        '} } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const itemGroups = result.data.documents[0].mainSequence.itemGroups;
      t.equal(itemGroups.length, 3);
      t.equal(itemGroups[1].scopeLabels.length, 3);
      t.ok(itemGroups[1].scopeLabels.includes('chapter/1'));
      t.ok(itemGroups[1].scopeLabels.includes('verse/2'));
      t.ok(itemGroups[1].scopeLabels.includes('blockTag/q'));
      t.ok(itemGroups[1].text.startsWith('Instead'));
      t.ok(itemGroups[1].text.endsWith('Yahweh teaches.'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Items & tokens by scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const query = '{ documents { mainSequence { itemGroups(byScopes:["chapter/", "verse/"]) {' +
        'scopeLabels ' +
        `items {type subType payload} ` +
        'tokens { payload }' +
        '} } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const itemGroups = result.data.documents[0].mainSequence.itemGroups;
      t.equal(itemGroups.length, 3);
      t.equal(itemGroups[1].scopeLabels.length, 3);
      t.equal(itemGroups[1].items.filter(i => i.type === 'token')[0].payload, 'Instead');
      t.equal(itemGroups[1].items.filter(i => i.type === 'token').reverse()[0].payload, '.');
      t.equal(itemGroups[1].tokens[0].payload, 'Instead');
      t.equal([...itemGroups[1].tokens].reverse()[0].payload, '.');
      t.equal(itemGroups[0].items.filter(i => i.type === 'graft').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Text by scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const query = '{ documents { mainSequence { itemGroups(byMilestones:["milestone/ts"]) {' +
        'scopeLabels text ' +
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
    } catch (err) {
      console.log(err);
    }
  },
);
