/* eslint-disable no-unused-vars */
const path = require('path');
const test = require('tape');
const fs = require('fs-extra');
const { utils } = require('../../../../dist/index');
const ByteArray = utils.ByteArray;
const { unpackEnum } = utils.succinct;
const { inspectEnum, inspectSuccinct } = utils.inspect;
const { enumStringIndex, enumRegexIndexTuples } = utils.enums;

const testGroup = 'Inspect';

const serialized = fs.readJsonSync(path.resolve(__dirname, '../test_data/serialize_example.json'));

test(
  `enum array (${testGroup})`,
  function (t) {
    try {
      t.plan(Object.keys(serialized.enums).length);

      for (const enumString of Object.values(serialized.enums)) {
        const ba = new ByteArray();
        ba.fromBase64(enumString);
        const enumArray = unpackEnum(ba);
        t.ok(enumArray);
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `enum entries (${testGroup})`,
  function (t) {
    try {
      t.plan(Object.keys(serialized.enums).length);

      for (const [category, enumString] of Object.entries(serialized.enums)) {
        const ba = new ByteArray();
        ba.fromBase64(enumString);
        const enumStrings = unpackEnum(ba);
        const inspected = inspectEnum(enumString);
        // console.log("***", category, "***");
        // console.log(inspected);
        t.ok(inspected);
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `succinct (${testGroup})`,
  function (t) {
    try {
      t.plan(12);
      const doc = Object.values(serialized.docs)[0];
      const mainSequence = doc.sequences[doc.mainId];

      for (const block of mainSequence.blocks) {
        for (const [category, succinct] of Object.entries(block)) {
          const inspected = inspectSuccinct(succinct, serialized.enums);
          // console.log("***", category, "***");
          // console.log(inspected);
          t.ok(inspected);
        }
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `enum index (${testGroup})`,
  function (t) {
    try {
      t.plan(Object.entries(serialized.enums).length);

      for (const [category, enumString] of Object.entries(serialized.enums)) {
        const ba = new ByteArray();
        ba.fromBase64(enumString);
        const enumValues = unpackEnum(ba);
        let allGood = true;
        let count = 0;

        for (const enumValue of enumValues) {
          const enumIndex = enumStringIndex(ba, enumValue);

          if (enumIndex < 0) {
            allGood = false;
            break;
          }

          if (enumIndex !== count) {
            allGood = false;
            break;
          }
          count += 1;
        }
        t.ok(allGood);
      }
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `enum regex indexes (${testGroup})`,
  function (t) {
    try {
      const expectedTokens = ['you', 'your', 'young', 'yourself', 'You', 'Your'];
      t.plan(1 + expectedTokens.length);
      const enumString = serialized.enums.wordLike;
      const ba = new ByteArray();
      ba.fromBase64(enumString);
      const enumIndexes = enumRegexIndexTuples(ba, 'You');
      const foundTokens = enumIndexes.map(ei => ei[1]);
      t.equal(foundTokens.length, expectedTokens.length);

      for (const expectedToken of expectedTokens) {
        t.ok(foundTokens.includes(expectedToken));
      }
    } catch (err) {
      console.log(err);
    }
  },
);
