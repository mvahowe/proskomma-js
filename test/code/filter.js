const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Filter on Parse';

const queryToBlock = async (t, filter) => {
  const pk = pkWithDoc('../test_data/usfm/filter.usfm', {
    lang: 'fra',
    abbr: 'hello',
  }, filter)[0];
  const query = `{ documents { mainSequence { blocks { bg { subType } bs { payload } scopeLabels items {type subType payload} } } } }`;
  const result = await pk.gqlQuery(query);
  t.equal(result.errors, undefined);
  return result.data.documents[0].mainSequence.blocks[0];
};

const inlineGrafts = block => {
  return block.items.filter(i => i.type === 'graft');
};

test(
  `No Filter (${testGroup})`,
  async function (t) {
    try {
      const scopeLabels = [
        'chapter/1',
        'verse/1',
        'verses/1',
        'span/nd',
        'span/it',
        'span/bd',
        'blockTag/p',
      ];
      t.plan(6 + scopeLabels.length);
      const block = await queryToBlock(t, {});
      t.equal(block.bg.length, 2);
      t.equal(block.bg[0].subType, 'title');
      t.equal(block.bg[1].subType, 'heading');
      t.equal(block.scopeLabels.length, 7);
      for (const scopeLabel of scopeLabels) {
        t.ok(block.scopeLabels.includes(scopeLabel));
      }
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude All Scopes (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const block = await queryToBlock(t, { includeScopes: [] });
      t.equal(block.bg.length, 2);
      t.equal(block.scopeLabels.length, 1);
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude All Grafts (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const block = await queryToBlock(t, { includeGrafts: [] });
      t.equal(block.bg.length, 0);
      t.equal(block.scopeLabels.length, 7);
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude Everything (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const block = await queryToBlock(t, {
        includeGrafts: [],
        includeScopes: [],
      });
      t.equal(block.bg.length, 0);
      t.equal(block.scopeLabels.length, 1);
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude Nothing (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const block = await queryToBlock(t, {
        excludeGrafts: [],
        excludeScopes: [],
      });
      t.equal(block.bg.length, 2);
      t.equal(block.scopeLabels.length, 7);
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Include chapter/verse (${testGroup})`,
  async function (t) {
    try {
      const scopeLabels = [
        'chapter/1',
        'verse/1',
      ];
      t.plan(2 + scopeLabels.length);
      const block = await queryToBlock(t, { includeScopes: ['chapter', 'verse/'] });
      t.equal(block.scopeLabels.length, 3);
      for (const scopeLabel of scopeLabels) {
        t.ok(block.scopeLabels.includes(scopeLabel));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude chapter/verse (${testGroup})`,
  async function (t) {
    try {
      const scopeLabels = [
        'verses/1',
        'span/nd',
        'span/it',
        'span/bd',
      ];
      t.plan(2 + scopeLabels.length);
      const block = await queryToBlock(t, { excludeScopes: ['chapter', 'verse/'] });
      t.equal(block.scopeLabels.length, 5);
      for (const scopeLabel of scopeLabels) {
        t.ok(block.scopeLabels.includes(scopeLabel));
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Include Title (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const block = await queryToBlock(t, { includeGrafts: ['title'] });
      t.equal(block.bg.length, 1);
      t.equal(block.bg[0].subType, 'title');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude Title (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const block = await queryToBlock(t, { excludeGrafts: ['title'] });
      t.equal(block.bg.length, 1);
      t.equal(block.bg[0].subType, 'heading');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Include Inline (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const block = await queryToBlock(t, { includeGrafts: ['footnote'] });
      t.equal(block.bg.length, 0);
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Exclude Inline (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const block = await queryToBlock(t, { excludeGrafts: ['footnote'] });
      t.equal(block.bg.length, 2);
      const inlines = inlineGrafts(block);
      t.equal(inlines.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
