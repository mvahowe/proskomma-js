const test = require('tape');
const deepCopy = require('deep-copy-all');
const { pkWithDoc } = require('../lib/load');

const testGroup = 'Mutate Update Operations';

const object2Query = obs => '[' + obs.map(ob => `{type: "${ob.type}" subType: "${ob.subType}" payload: "${ob.payload}"}`).join(', ') + ']';

const cleanPk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'ust',
}, {}, {}, [], [])[0];

const blockSetup = async t => {
  const pk = deepCopy(cleanPk);
  let query = '{docSets { id documents { id nSequences  sequences { id type } mainSequence { id blocks(positions: [0]) { text items { type subType payload } } } } } }';
  let result = await pk.gqlQuery(query);
  t.equal(result.errors, undefined);
  t.equal(result.data.docSets.length, 1);
  const docSet = result.data.docSets[0];
  const document = docSet.documents[0];
  const sequence = document.mainSequence;
  let block = sequence.blocks[0];
  const items = block.items;
  return [pk, docSet, document, sequence, block, items];
};

const searchScopes = (items, searchStr) => items.filter(i => i.type === 'scope' && i.payload.includes(searchStr));
const searchGrafts = (items, searchStr) => items.filter(i => i.type === 'graft' && i.subType.includes(searchStr));

test(
  `updateItems args exceptions (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      let query = `mutation { updateItems(` +
        `docSetId: "1234"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(items)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'DocSet \'1234\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "5678"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(items)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Document \'5678\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "9012"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(items)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Sequence \'9012\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 1000` +
        ` items: ${object2Query(items)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Could not find block 1000 (length=42)');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems, existing token enums (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      t.ok(block.text.includes('country'));
      t.ok(block.text.includes('land'));

      const newItems = items
        .map(i => (
          {
            type: i.type,
            subType: i.subType,
            payload: i.payload.replace('country', 'land'),
          }
        ));

      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItems)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.ok(!block.text.includes('country'));
      t.ok(block.text.includes('land'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems, new token enum (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      t.ok(block.text.includes('country'));
      t.ok(!block.text.includes('nation'));

      const newItemObjects = items
        .map(i => (
          {
            type: i.type,
            subType: i.subType,
            payload: i.payload.replace('country', 'nation'),
          }
        ));

      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.ok(!block.text.includes('country'));
      t.ok(block.text.includes('nation'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems - add blockGraft (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      const titleId = document.sequences.filter(s => s.type === 'title')[0].id;
      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(items)}` +
        ` blockGrafts: ${object2Query([{
          type: 'graft',
          subType: 'title',
          payload: titleId,
        }])}` +
        `) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { bg { subType payload } text } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.equal(block.bg.length, 1);
      t.equal(block.bg[0].subType, 'title');
      t.equal(block.bg[0].payload, titleId);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems, new scope enum (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      t.equal(searchScopes(items, '/1').length, 5);
      t.equal(searchScopes(items, '/23').length, 0);

      const newItemObjects = items
        .map(i => (
          {
            type: i.type,
            subType: i.subType,
            payload: i.payload.replace(/1$/g, '23'),
          }
        ));

      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text items { type subType payload } } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.equal(searchScopes(block.items, '/1').length, 0);
      t.equal(searchScopes(block.items, '/23').length, 5);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems, new open-and-closed scope (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      t.ok(!block.text.includes('banana'));

      const newItems = items.concat([
        {
          type: 'scope',
          subType: 'start',
          payload: 'span/bd',
        },
        {
          type: 'token',
          subType: 'wordLike',
          payload: 'banana',
        },
        {
          type: 'scope',
          subType: 'end',
          payload: 'span/bd',
        },
      ]);
      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItems)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.ok(block.text.includes('banana'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems, scope type exception (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);

      const newItemObjects = items
        .map(i => (
          {
            type: i.type,
            subType: i.subType,
            payload: i.payload.replace(/chapter/g, 'BANANA'),
          }
        ));

      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.includes('BANANA'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `updateItems, new graft enum (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      t.equal(searchGrafts(items, 'footnote').length, 1);
      t.equal(searchGrafts(items, 'BANANA').length, 0);

      const newItemObjects = items
        .map(i => (
          {
            type: i.type,
            subType: i.subType.replace(/footnote/g, 'BANANA'),
            payload: i.payload,
          }
        ));

      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text items { type subType payload } } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.equal(searchGrafts(block.items, 'footnote').length, 0);
      t.equal(searchGrafts(block.items, 'BANANA').length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `gcSequences (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      const nSequences = document.nSequences;
      const newItemObjects = items.filter(i => i.type !== 'graft');
      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { documents { nSequences } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].documents[0].nSequences, nSequences);
      query = `mutation { gcSequences(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        `) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.gcSequences, true);
      query = '{docSets { documents { nSequences } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].documents[0].nSequences, nSequences - 2);
    } catch (err) {
      console.log(err);
    }
  },
);
