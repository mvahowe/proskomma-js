const test = require('tape');
const {utils} = require("../../dist/index");
const { validateTags } = utils.tags;
const { pkWithDoc } = require('../lib/load');

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
}, {}, {}, [], ['frob', 'frob2'])[0];
pk.docSetList()[0].tags.add('foo');
pk.docSetList()[0].tags.add('foo2');
const document = Object.values(pk.documents)[0];
document.sequences[document.mainId].tags.add('banana');
document.sequences[document.mainId].tags.add('split');

const testGroup = 'Graph Tags';

test(
  `DocSet accessors (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ docSets { tags hasFoo: hasTag(tagName:"foo") hasBaa: hasTag(tagName:"baa")} }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const docSet = result.data.docSets[0];
      t.equal(docSet.tags.length, 2);
      t.ok(docSet.tags.includes('foo'));
      t.ok(docSet.hasFoo);
      t.false(docSet.hasBaa);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `DocSet selectors (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ docSets(withTags:"foo" withoutTags:"oof") { id } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      query = '{ docSets(withTags:["foo" "foo2"]) { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      query = '{ docSets(withTags:["foo" "oof"]) { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 0);
      query = '{ docSets(withoutTags:["foo" "oof"]) { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document accessors (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ docSets { documents { tags hasFrob: hasTag(tagName:"frob") hasBrof: hasTag(tagName:"brof")} } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const document = result.data.docSets[0].documents[0];
      t.equal(document.tags.length, 2);
      t.ok(document.tags.includes('frob'));
      t.ok(document.hasFrob);
      t.false(document.hasBrof);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Root-level Document selectors (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ documents(withTags:"frob" withoutTags:"brof") { id } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 1);
      query = '{ documents(withTags:["frob" "frob2"]) { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 1);
      query = '{ documents(withTags:["frob" "brof"]) { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 0);
      query = '{ documents(withoutTags:["frob" "brof"]) { id } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document in docSet selectors (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ docSet(id:"eng_web") { documents(withTags:"frob" withoutTags:"brof") { id } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSet.documents.length, 1);
      query = '{ docSet(id:"eng_web") { documents(withTags:["frob" "frob2"]) { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSet.documents.length, 1);
      query = '{ docSet(id:"eng_web") { documents(withTags:["frob" "brof"]) { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSet.documents.length, 0);
      query = '{ docSet(id:"eng_web") { documents(withoutTags:["frob" "brof"]) { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSet.documents.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence accessors (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ docSets { documents { mainSequence { tags hasBanana: hasTag(tagName:"banana") hasApple: hasTag(tagName:"apple") } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequence = result.data.docSets[0].documents[0].mainSequence;
      t.equal(sequence.tags.length, 2);
      t.ok(sequence.tags.includes('banana'));
      t.ok(sequence.hasBanana);
      t.false(sequence.hasApple);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence selectors (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ documents { sequences(withTags:"banana" withoutTags:"melba") { id } } } ';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].sequences.length, 1);
      query = '{ documents { sequences(withTags: ["banana" "split"]) { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].sequences.length, 1);
      query = '{ documents { sequences(withTags: ["banana" "melba"]) { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].sequences.length, 0);
      query = '{ documents { sequences(withTags:"banana" withoutTags: ["peach" "split"]) { id } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].sequences.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Throw on bad tag format (${testGroup})`,
  // Destructive!
  async function (t) {
    try {
      t.plan(2);
      const importFn = () =>
        pkWithDoc('../test_data/usx/web_rut.usx', {
          lang: 'eng',
          abbr: 'ust',
        }, {}, {}, [], ['FROB']);
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
  // Destructive!
  async function (t) {
    try {
      t.plan(2);
      const importFn = () =>
        pkWithDoc('../test_data/usx/web_rut.usx', {
          lang: 'eng',
          abbr: 'ust',
        }, {}, {}, [], ['FROB']);
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

test(
  `tagsKv on docSet (${testGroup})`,
  // Relies on destructive tests above
  async function (t) {
    try {
      t.plan(5);
      pk.docSetList()[0].tags.add('baa');
      const result = pk.gqlQuerySync('{ docSets { tagsKv { key value } } }');
      t.equal(result.errors, undefined);
      const tagsKv = result.data.docSets[0].tagsKv;
      t.equal(tagsKv.filter(kv => kv.key === 'baa').length, 1);
      t.equal(tagsKv.filter(kv => kv.key === 'frob').length, 1);
      t.equal(tagsKv.filter(kv => kv.key === 'baa')[0].value, '');
      t.ok(tagsKv.filter(kv => kv.key === 'frob')[0].value.startsWith('Fooie'));
    } catch (err) {
      console.log(err);
    }
  },
);
