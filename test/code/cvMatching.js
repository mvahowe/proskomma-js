const test = require('tape');
const xre = require('xregexp');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'cvMatching';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk2 = pkWithDoc('../test_data/usfm/web_psa51.usfm', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `Error on no filters (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { cvMatching { scopeLabels text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(xre.test(result.errors[0].message, /Must specify at least one/));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Error on conflicting filters (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { cvMatching(withChars:"foo", withMatchingChars:"baa") { scopeLabels text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(xre.test(result.errors[0].message, /Must not specify both/));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `either of 2 exact (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { cvMatching(withChars:["Ruth", "Boaz"]) { scopeLabels text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].cvMatching.length, 28);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `both of 2 exact (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { cvMatching(withChars:["Ruth", "Boaz"], allChars:true) { scopeLabels text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].cvMatching.length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `either of 2 matching (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { cvMatching(withMatchingChars:["Ruth", "Moab"]) { scopeLabels text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].cvMatching.length, 17);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `both of 2 matching (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { cvMatching(withMatchingChars:["Ruth", "Moab"], allChars:true) { scopeLabels text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].cvMatching.length, 6);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `scope (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ documents { cvMatching(withScopes:"attribute/spanWithAtts/w/strong/0/H517") { scopeLabels text } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].cvMatching.length, 1);
      t.ok(result.data.documents[0].cvMatching[0].text.includes('Purify'));
    } catch (err) {
      console.log(err);
    }
  },
);
