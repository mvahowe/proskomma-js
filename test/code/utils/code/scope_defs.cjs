const test = require('tape');
const { utils } = require('../../../../dist/index');
const {
  scopeEnum, scopeEnumLabels, labelForScope, nComponentsForScope,
} = utils.scopeDefs;

const testGroup = 'Scope Def';

test(
  `scopeEnum (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      t.equal(scopeEnum['chapter'], 2);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `scopeEnumLabels (${testGroup})`,
  async function (t) {
    try {
      t.plan(1);
      t.equal(scopeEnumLabels[2], 'chapter');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `labelForScope (${testGroup})`,
  async function (t) {
    try {
      t.plan(19);
      t.equal(labelForScope('blockTag', ['p']), 'blockTag/p');
      t.equal(labelForScope('inline', ['f']), 'inline/f');
      t.equal(labelForScope('chapter', ['1']), 'chapter/1');
      t.equal(labelForScope('verses', ['1-3']), 'verses/1-3');
      t.equal(labelForScope('verse', ['2']), 'verse/2');
      t.equal(labelForScope('span', ['nd']), 'span/nd');
      t.equal(labelForScope('table', []), 'table');
      t.equal(labelForScope('cell', ['thr2-3']), 'cell/colHeading/right/2');
      t.equal(labelForScope('milestone', ['zaln']), 'milestone/zaln');
      t.equal(labelForScope('spanWithAtts', ['w']), 'spanWithAtts/w');
      t.equal(labelForScope('attribute', ['milestone', 'zaln', 'x-content', '0']), 'attribute/milestone/zaln/x-content/0');
      t.equal(labelForScope('orphanTokens'), 'orphanTokens');
      t.equal(labelForScope('hangingGraft'), 'hangingGraft');
      t.equal(labelForScope('pubChapter', ['1']), 'pubChapter/1');
      t.equal(labelForScope('pubVerse', ['1']), 'pubVerse/1');
      t.equal(labelForScope('altChapter', ['1']), 'altChapter/1');
      t.equal(labelForScope('altVerse', ['1']), 'altVerse/1');
      t.equal(labelForScope('esbCat', ['x']), 'esbCat/x');
      t.throws(() => labelForScope('banana'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `nComponentsForScope (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      t.equal(nComponentsForScope('table'), 1);
      t.equal(nComponentsForScope('blockTag'), 2);
      t.equal(nComponentsForScope('cell'), 4);
      t.equal(nComponentsForScope('attribute'), 6);
      t.throws(() => nComponentsForScope('banana'));
    } catch (err) {
      console.log(err);
    }
  },
);

