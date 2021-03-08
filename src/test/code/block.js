const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph Block';

const pk = pkWithDoc('../test_data/usfm/hello.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk2 = pkWithDoc('../test_data/usfm/headings.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk3 = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk4 = pkWithDoc('../test_data/usfm/footnote.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk5 = pkWithDoc('../test_data/usfm/verse_breaks_in_blocks.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk6 = pkWithDoc('../test_data/usfm/whitespace.usfm', {
  lang: 'eng',
  abbr: 'ust',
})[0];
const pk7 = pkWithDoc('../test_data/usx/web_psa.usx', {
  lang: 'eng',
  abbr: 'ust',
})[0];

const blocksText = blocks => blocks.map(
  b => b.items.map(
    i => i.type === 'token' ? i.payload : '',
  ).map(
    t => t.replace(/[ \n\r\t]+/, ' '),
  ).join(''),
).join(' ')
  .trim();

test(
  `Length (${testGroup})`,
  async function (t) {
    try {
      const lengths = {
        cBL: 78,
        bgBL: 0,
        osBL: 0,
        isBL: 9,
      };
      t.plan(2 + Object.keys(lengths).length);
      const query = '{ documents { mainSequence { blocks { cBL bgBL osBL isBL } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);

      for (const [field, value] of Object.entries(lengths)) {
        t.equal(result.data.documents[0].mainSequence.blocks[0][field], value);
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Length in Items (${testGroup})`,
  async function (t) {
    try {
      const lengths = [
        {
          cL: 578,
          bgL: 1,
          osL: 0,
          isL: 19,
        },
        {
          cL: 65,
          bgL: 0,
          osL: 3,
          isL: 2,
        },
      ];
      t.plan(2 + (lengths.length * Object.keys(lengths[0]).length));
      const query = '{ documents { mainSequence { blocks { cL bgL osL isL } } } }';
      const result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);

      for (const blockNo of [0, 1]) {
        const block = result.data.documents[0].mainSequence.blocks[blockNo];

        for (const [field, value] of Object.entries(lengths[blockNo])) {
          t.equal(block[field], value);
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Render as Text (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ documents { mainSequence { blocks { text dump } } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.text, 'Dear Theophilus,');
      t.ok(block.dump.includes('+verse/1+'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Normalize whitespace (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { mainSequence { blocks { text(normalizeSpace:true) } } } }';
      const result = await pk6.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.text, 'This is how the Good News of JC began...');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Scopes (${testGroup})`,
  async function (t) {
    try {
      const scopeLabels = [
        'chapter/1',
        'verse/1',
        'verses/1',
        'blockTag/p',
      ];
      t.plan(2 + scopeLabels.length);
      const query = '{ documents { mainSequence { blocks { scopeLabels bs { payload } } } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.bs.payload, 'blockTag/p');

      for (const scopeLabel of scopeLabels) {
        t.ok(block.scopeLabels.includes(scopeLabel));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Grafts (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ documents { mainSequence { blocks { bg { subType payload } } } } }';
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      const block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.bg[0].subType, 'title');
      t.equal(block.bg[1].subType, 'heading');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Tokens (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = `{ documents { mainSequence { blocks { tokens { type subType payload } } } } }`;
      const result = await pk4.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('blocks' in result.data.documents[0].mainSequence);
      const blocks = result.data.documents[0].mainSequence.blocks;
      t.equal(blocks[2].tokens.filter(i => i.type === 'graft').length, 0);
      t.equal(blocks[0].tokens.filter(i => i.type === 'scope').length, 0);
      t.ok(blocks[0].tokens.filter(i => i.type === 'token').length > 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Items (${testGroup})`,
  async function (t) {
    try {
      const openScopes = [
        'chapter/1',
        'verse/9',
        'verses/9',
      ];
      t.plan(15 + openScopes.length);
      const query = '{ documents { mainSequence { blocks {' +
        `items {type subType payload}` +
        `bg {subType}` +
        `os {type payload}` +
        `is {type payload}` +
        '} } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.items[0].type, 'scope');
      t.equal(block.items[0].payload, 'chapter/1');
      t.equal(block.items[3].subType, 'wordLike');
      t.equal(block.items[3].payload, 'This');
      t.equal(block.os.length, 0);
      t.equal(block.bg.length, 0);
      t.equal(block.is.length, 3);
      t.equal(block.is[0].payload, 'chapter/1');
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      block = result.data.documents[0].mainSequence.blocks[0];
      t.equal(block.bg.length, 2);
      t.equal(block.bg[0].subType, 'title');
      t.equal(block.bg[1].subType, 'heading');
      result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      block = result.data.documents[0].mainSequence.blocks[1];
      t.equal(block.os.length, 3);

      for (const openScope of openScopes) {
        t.ok(block.os.map(s => s.payload).includes(openScope));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Items withScopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const requiredScopes = '["chapter/1", "verse/2"]';
      const query = `{ documents { mainSequence { blocks(withScopes:${requiredScopes}) { items(withScopes:${requiredScopes}) {type subType payload} } } } }`;
      let result = await pk5.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      const texts = blocksText(blocks);

      t.equal(
        texts,
        'Instead, those with whom Yahweh is pleased delight in understanding what he teaches us. ' +
        'They read and think every day and every night about what Yahweh teaches.',
      );
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Tokens withScopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const requiredScopes = '["chapter/1", "verse/2"]';
      const query = `{ documents { mainSequence { blocks(withScopes:${requiredScopes}) {items: tokens(withScopes:${requiredScopes}) { type subType payload } } } } }`;
      let result = await pk5.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      const texts = blocksText(blocks);

      t.equal(
        texts,
        'Instead, those with whom Yahweh is pleased delight in understanding what he teaches us. ' +
        'They read and think every day and every night about what Yahweh teaches.',
      );
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Items anyScope (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const requiredScopes = '["chapter/1", "verse/2"]';
      const query = `{ documents { mainSequence { blocks(withScopes:${requiredScopes}) { items(anyScope:true withScopes:["verse/2", "verse/2000"]) {type subType payload} } } } }`;
      let result = await pk5.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      const texts = blocksText(blocks);

      t.equal(
        texts,
        'Instead, those with whom Yahweh is pleased delight in understanding what he teaches us. ' +
        'They read and think every day and every night about what Yahweh teaches.',
      );
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Tokens anyScope (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const requiredScopes = '["chapter/1", "verse/2"]';
      const query = `{ documents { mainSequence { blocks(withScopes:${requiredScopes}) { items: tokens(anyScope:true withScopes:["verse/2", "verse/2000"]) { type subType payload } } } } }`;
      let result = await pk5.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      const texts = blocksText(blocks);

      t.equal(
        texts,
        'Instead, those with whom Yahweh is pleased delight in understanding what he teaches us. ' +
        'They read and think every day and every night about what Yahweh teaches.',
      );
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Tokens withChars (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const requiredChars = '["tree"]';
      const query = `{documents { mainSequence { blocks(withChars:${requiredChars}) {` +
        `tokens(withChars:${requiredChars} includeContext:true) { payload scopes(startsWith:["chapter", "verses"])} } } } }`;
      let result = await pk7.gqlQuery(query);
      t.equal(result.errors, undefined);
      const blocks = result.data.documents[0].mainSequence.blocks;
      const tokens = blocks.map(b => b.tokens.map(t => t.payload)).reduce((a, b) => a.concat(b));
      t.ok(tokens.filter(s => s === 'tree').length > 1);
      t.equal(tokens.filter(s => s !== 'tree').length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `ItemObjects (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      const query = '{documents { sequences { blocks { text } } mainSequence { blocks { itemObjects { type subType payload } } } } }';
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);
