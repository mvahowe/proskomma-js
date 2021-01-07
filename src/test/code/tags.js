const test = require('tape');
const { validateTags } = require('proskomma-utils');
const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], ['frob'])[0];
pk.docSetList()[0].tags.add('foo');
const document = Object.values(pk.documents)[0];
document.sequences[document.mainId].tags.add('banana');

const testGroup = 'Graph Tags';

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ docSets { tags hasFoo: hasTag(tagName:"foo") hasBaa: hasTag(tagName:"baa")} }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docSet = result.data.docSets[0];
      t.equal(docSet.tags.length, 1);
      t.ok(docSet.tags.includes('foo'));
      t.ok(docSet.hasFoo);
      t.false(docSet.hasBaa);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ docSets { documents { tags hasFrob: hasTag(tagName:"frob") hasBrof: hasTag(tagName:"brof")} } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].documents[0];
      t.equal(document.tags.length, 1);
      t.ok(document.tags.includes('frob'));
      t.ok(document.hasFrob);
      t.false(document.hasBrof);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ docSets { documents { mainSequence { tags hasBanana: hasTag(tagName:"banana") hasApple: hasTag(tagName:"apple") } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequence = result.data.docSets[0].documents[0].mainSequence;
      t.equal(sequence.tags.length, 1);
      t.ok(sequence.tags.includes('banana'));
      t.ok(sequence.hasBanana);
      t.false(sequence.hasApple);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Throw on bad tag format (${testGroup})`,
  // Destructive so do last (ish)!
  async function (t) {
    try {
      t.plan(2);
      const importFn = () =>
        pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], ['FROB']);
      t.throws(importFn, /Tag 'FROB' is not valid/);
      const addTagFn = () => {
        pk.docSetList()[0].tags.add('FROB');
        validateTags(pk.docSetList()[0].tags);
      };
      t.throws(addTagFn, /Tag 'FROB' is not valid/);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Support colon tag format (${testGroup})`,
  // Destructive so do last!
  async function (t) {
    try {
      t.plan(2);
      const importFn = () =>
        pkWithDoc('../test_data/usx/web_rut.usx', { lang: 'eng', abbr: 'ust' }, {}, {}, [], ['FROB']);
      t.throws(importFn, /Tag 'FROB' is not valid/);
      const addTagFn = () => {
        pk.docSetList()[0].tags.delete('FROB');
        pk.docSetList()[0].tags.add('frob:Fooie!! §');
        validateTags(pk.docSetList()[0].tags);
      };
      t.doesNotThrow(addTagFn);
    } catch (err) {
      console.log(err);
    }
  },
);

