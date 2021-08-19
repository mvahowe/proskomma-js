const test = require('tape');
const deepCopy = require('deep-copy-all');
const { pkWithDoc } = require('../lib/load');

const testGroup = 'Mutate Update Operations';

const object2Query = obs => '[' + obs.map(ob => `{type: "${ob.type}" subType: "${ob.subType}" payload: "${ob.payload}"}`).join(', ') + ']';
const oneObject2Query = ob => `{type: "${ob.type}" subType: "${ob.subType}" payload: "${ob.payload}"}`;
const blocksSpec2Query = bSpec => '[' + bSpec.map(b => `{bs: ${oneObject2Query(b.bs)}, bg: ${object2Query(b.bg)}, items: ${object2Query(b.items)}}`) + ']';

const cleanPk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'ust',
}, {}, {}, [], [])[0];

const blockSetup = async t => {
  const pk = deepCopy(cleanPk);
  let query = '{docSets { id documents { id nSequences  sequences { id type } mainSequence { id blocks(positions: [0]) { bs { payload } text items { type subType payload } } } } } }';
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

const blocksSpec = [
  {
    'bs': {
      'type': 'scope',
      'subType': 'start',
      'payload': 'blockTag/m',
    },
    'bg': [
      {
        'type': 'graft',
        'subType': 'title',
        'payload': 'YzlkNTI1YmIt',
      },
    ],
    'items': [
      {
        'type': 'scope',
        'subType': 'start',
        'payload': 'chapter/1',
      },
      {
        'type': 'scope',
        'subType': 'start',
        'payload': 'verses/1',
      },
      {
        'type': 'scope',
        'subType': 'start',
        'payload': 'verse/1',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'Start',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'of',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'the',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'Good',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'News',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'of',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'Jesus',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'Christ',
      },
      {
        'type': 'token',
        'subType': 'punctuation',
        'payload': ',',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'Son',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'of',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'God',
      },
      {
        'type': 'token',
        'subType': 'punctuation',
        'payload': '.',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'scope',
        'subType': 'end',
        'payload': 'verse/1',
      },
      {
        'type': 'scope',
        'subType': 'end',
        'payload': 'verses/1',
      },
      {
        'type': 'scope',
        'subType': 'start',
        'payload': 'verses/2',
      },
      {
        'type': 'scope',
        'subType': 'start',
        'payload': 'verse/2',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'In',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'the',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'book',
      },
      {
        'type': 'token',
        'subType': 'lineSpace',
        'payload': ' ',
      },
      {
        'type': 'token',
        'subType': 'wordLike',
        'payload': 'of',
      },
      {
        'type': 'token',
        'subType': 'punctuation',
        'payload': '.',
      },
      {
        'type': 'token',
        'subType': 'punctuation',
        'payload': '.',
      },
      {
        'type': 'token',
        'subType': 'punctuation',
        'payload': '.',
      },
      {
        'type': 'scope',
        'subType': 'end',
        'payload': 'verse/2',
      },
      {
        'type': 'scope',
        'subType': 'end',
        'payload': 'verses/2',
      },
      {
        'type': 'scope',
        'subType': 'end',
        'payload': 'chapter/1',
      },
    ],
  },
];

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
  `updateItems - change BlockScope (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      const bs = block.bs.payload;
      t.equal(bs, 'blockTag/p');
      let query = `mutation { updateItems(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blockPosition: 0` +
        ` items: ${object2Query(items)}` +
        ` blockScope: ${oneObject2Query({
          type: 'scope',
          subType: 'start',
          payload: 'blockTag/q',
        })}` +
        `) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateItems, true);
      query = '{docSets { id documents { id mainSequence { id blocks(positions: [0]) { bs { payload } text } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      block = result.data.docSets[0].documents[0].mainSequence.blocks[0];
      t.equal(block.bs.payload, 'blockTag/q');
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
  `updateBlocks (${testGroup})`,
  async function (t) {
    try {
      t.plan(12);
      let [pk, docSet, document, sequence, block, items] = await blockSetup(t);
      const blockQuery = blocksSpec2Query(blocksSpec);
      let query = `mutation { updateAllBlocks(` +
        `docSetId: "${docSet.id}"` +
        ` documentId: "${document.id}"` +
        ` sequenceId: "${sequence.id}"` +
        ` blocksSpec: ${blockQuery}) }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.updateAllBlocks, true);
      query = '{documents { mainSequence { id blocks { text bs {payload} bg {subType payload} } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const mainSequence = result.data.documents[0].mainSequence;
      t.equal(mainSequence.blocks.length, 1);
      t.ok(mainSequence.blocks[0].text.startsWith('Start of'));
      t.equal(mainSequence.blocks[0].bs.payload, 'blockTag/m');
      t.equal(mainSequence.blocks[0].bg.length, 1);
      t.equal(mainSequence.blocks[0].bg[0].subType, 'title');
      query = '{documents { mainSequence { id blocks { tokens { type subType payload } } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].mainSequence.blocks[0].tokens[0].payload, "Start");
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
