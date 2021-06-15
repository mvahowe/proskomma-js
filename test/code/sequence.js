const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph Sequence';

const [pk, pkDoc] = pkWithDoc('../test_data/usfm/hello.usfm', {
  lang: 'eng',
  abbr: 'ust',
});
const pk2 = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

test(
  `Scalars (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ documents { mainSequence { id type nBlocks } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('mainSequence' in result.data.documents[0]);
      t.ok('id' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.type, 'main');
      t.equal(result.data.documents[0].mainSequence.nBlocks, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Blocks (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainSequence { blocks { text } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.ok('text' in result.data.documents[0].mainSequence.blocks[0]);
      t.equal(result.data.documents[0].mainSequence.blocks[0].text, 'This is how the Good News of JC began...');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `position (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ documents { mainSequence { blocks(positions: [0]) { text } } } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 1);
      t.ok(result.data.documents[0].mainSequence.blocks[0].text.startsWith('In the days when the judges judged'));
      query = '{ documents { mainSequence { blocks(positions: []) { text } } } }';
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 0);
      query = '{ documents { mainSequence { blocks(positions: [1, 3, 1]) { text } } } }';
      result = await pk2.gqlQuery(query);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 2);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withScopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      let query = '{ documents { mainSequence { blocks(withScopes:["chapter/1", "verse/1"]) { text } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 1);
      t.equal(result.data.documents[0].mainSequence.blocks[0].text, 'This is how the Good News of JC began...');
      query = '{ documents { mainSequence { blocks(withScopes:["chapter/1", "verse/2"]) { text } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withBlockScope (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      let query = '{ documents { mainSequence { blocks(withBlockScope:"blockTag/p") { text } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 1);
      query = '{ documents { mainSequence { blocks(withBlockScope:"blockTag/q") { text } } } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocks.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withChars 'or' (${testGroup})`,
  async function (t) {
    try {
      t.plan(27);
      let query = '{ documents { mainSequence { blocks(withChars:["Boaz" "Naomi"]) { text } } } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(blocks.length, 24);

      for (const block of blocks) {
        t.ok(block.text.includes('Boaz') || block.text.includes('Naomi'));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withChars 'and' (${testGroup})`,
  async function (t) {
    try {
      t.plan(11);
      let query = '{ documents { mainSequence { blocks(withChars:["Boaz" "Naomi"] allChars: true) { text } } } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(blocks.length, 8);

      for (const block of blocks) {
        t.ok(block.text.includes('Boaz') && block.text.includes('Naomi'));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withMatchingChars 'or' (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query = '{ documents { mainSequence { blocks(withMatchingChars:["judge", "amminadab"]) { text } } } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(blocks.length, 2);
      // console.log(JSON.stringify(blocks, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `withMatchingChars 'and' (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      let query = '{ documents { mainSequence { blocks(withMatchingChars:["naomi", "ruth", "boaz", "field"] allChars:true) { text } } } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(blocks.length, 3);
      // console.log(JSON.stringify(blocks, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `wordLikes (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { mainSequence { wordLikes } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok(result.data.documents[0].mainSequence.wordLikes.includes('Good'));
    } catch
    (err) {
      console.log(err);
    }
  },
);

test(
  `hasChars (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '' +
        '{' +
        '  documents {' +
        '    mainSequence {' +
        '      orLogic: hasChars(chars:["Ruth", "Boaz", "banana"])' +
        '      andLogic: hasChars(chars:["Ruth", "Boaz", "banana"] allChars:true)' +
        '      allMiss: hasChars(chars: ["banana", "grapefruit"])' +
        '    }' +
        '  }' +
        '}';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequence = result.data.documents[0].mainSequence;
      t.ok(sequence.orLogic);
      t.ok(!sequence.andLogic);
      t.ok(!sequence.allMiss);
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `hasMatchingChars (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '' +
        '{' +
        '  documents {' +
        '    mainSequence {' +
        '      orLogic: hasMatchingChars(chars:["Rut", "oaz", "banana"])' +
        '      andLogic: hasMatchingChars(chars:["Rut", "oaz", "banana"] allChars:true)' +
        '    }' +
        '  }' +
        '}';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const sequence = result.data.documents[0].mainSequence;
      t.ok(sequence.orLogic);
      t.ok(!sequence.andLogic);
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `blocksItems (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const query = '{ documents { mainSequence { blocksItems { type subType payload } } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('blocksItems' in result.data.documents[0].mainSequence);
      const blocksItems = result.data.documents[0].mainSequence.blocksItems;
      t.equal(blocksItems[0][0].payload, 'chapter/1');
      t.equal(blocksItems[0][1].payload, 'verse/1');
      t.equal(blocksItems[0][2].payload, 'verses/1');
      t.equal(blocksItems[0][3].payload, 'In');
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `blocksTokens (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainSequence { blocksTokens { type subType payload } } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('blocksTokens' in result.data.documents[0].mainSequence);
      t.equal(result.data.documents[0].mainSequence.blocksTokens[0][0].payload, 'In');
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `blocksText (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainSequence { blocksText } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('blocksText' in result.data.documents[0].mainSequence);
      t.ok(result.data.documents[0].mainSequence.blocksText[0].startsWith('In the days when'));
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `text (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainSequence { text } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('text' in result.data.documents[0].mainSequence);
      t.ok(result.data.documents[0].mainSequence.text.startsWith('In the days when'));
    } catch
      (err) {
      console.log(err);
    }
  },
);
