const test = require('tape');
const deepEqual = require('deep-equal');

const { utils } = require('../../../../dist/index');
const { itemObjects2Arrays, itemArrays2Objects } = utils.itemDefs;

const itemObjects = [
  {
    type: 'token',
    subType: 'wordLike',
    payload: 'Hello',
  },
  {
    type: 'scope',
    subType: 'start',
    payload: 'blockTag/p',
  },
  {
    type: 'graft',
    subType: 'footnote',
    payload: 'abcdefg',
  },
];

const itemArrays = [
  ['token', 'wordLike', 'Hello'],
  ['scope', 'start', 'blockTag/p'],
  ['graft', 'footnote', 'abcdefg'],
];

const testGroup = 'item arrays and objects';

test(
  `Arrays to Objects (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      const newObjects = itemArrays2Objects(itemArrays);
      t.ok(deepEqual(itemObjects, newObjects));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Objects to Arrays (${testGroup})`,
  function (t) {
    try {
      t.plan(1);
      t.ok(deepEqual(itemArrays, itemObjects2Arrays(itemObjects)));
    } catch (err) {
      console.log(err);
    }
  },
);