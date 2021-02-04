const test = require('tape');
const { pkWithDoc } = require('../lib/load');

const testGroup = 'Mutate Update Operations';

const object2Query = obs => '[' + obs.map(ob => `{type: "${ob.type}" subType: "${ob.subType}" payload: "${ob.payload}"}`).join(', ') + ']';

const blockSetup = async t => {
  const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
    lang: 'eng',
    abbr: 'ust',
  }, {}, {}, [], [])[0];
  let query = '{docSets { id documents { id nSequences mainSequence { id blocks(positions: [0]) { text itemObjects { type subType payload } } } } } }';
  let result = await pk.gqlQuery(query);
  t.equal(result.errors, undefined);
  t.equal(result.data.docSets.length, 1);
  const docSet = result.data.docSets[0];
  const document = docSet.documents[0];
  const sequence = document.mainSequence;
  let block = sequence.blocks[0];
  const itemObjects = block.itemObjects;
  return [pk, docSet, document, sequence, block, itemObjects];
};

const searchScopes = (itemObjects, searchStr) => itemObjects.filter(i => i.type === 'scope' && i.payload.includes(searchStr));
const searchGrafts = (itemObjects, searchStr) => itemObjects.filter(i => i.type === 'graft' && i.subType.includes(searchStr));

test(
  `updateItems args exceptions (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);
      let query = `mutation { updateItems(` +
        `docSetId: "1234"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'DocSet \'1234\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "5678"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Document \'5678\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "9012"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors[0].message, 'Sequence \'9012\' not found');
      query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 1000` +
        ` itemObjects: ${object2Query(itemObjects)}) }`;
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
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);
      t.ok(block.text.includes('country'));
      t.ok(block.text.includes('land'));

      const newItemObjects = itemObjects
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
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
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
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);
      t.ok(block.text.includes('country'));
      t.ok(!block.text.includes('nation'));

      const newItemObjects = itemObjects
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
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
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
  `updateItems, new scope enum (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);
      t.equal(searchScopes(itemObjects, '/1').length, 5);
      t.equal(searchScopes(itemObjects, '/23').length, 0);

      const newItemObjects = itemObjects
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
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text itemObjects { type subType payload } } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.equal(searchScopes(block.itemObjects, '/1').length, 0);
      t.equal(searchScopes(block.itemObjects, '/23').length, 5);
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
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);

      const newItemObjects = itemObjects
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
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
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
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);
      t.equal(searchGrafts(itemObjects, 'footnote').length, 1);
      t.equal(searchGrafts(itemObjects, 'BANANA').length, 0);

      const newItemObjects = itemObjects
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
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { text itemObjects { type subType payload } } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.equal(searchGrafts(block.itemObjects, 'footnote').length, 0);
      t.equal(searchGrafts(block.itemObjects, 'BANANA').length, 1);
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
      let [pk, docSet, document, sequence, block, itemObjects] = await blockSetup(t);
      const nSequences = document.nSequences;
      const newItemObjects = itemObjects.filter(i => i.type !== 'graft');
      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` itemObjects: ${object2Query(newItemObjects)}) }`;
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
