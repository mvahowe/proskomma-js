/* eslint-disable require-await */
const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const { Proskomma } = require('../../src');

const testGroup = 'cleanUSFM';

test(
  `Remove chapters (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const pk = new Proskomma();
      let fp = '../test_data/usfm/frt.usfm';
      let content = fse.readFileSync(path.resolve(__dirname, fp));
      let cleanedLines = pk.cleanUsfm(content, { remove: ['\\c'] })
        .split('\n')
        .filter(l => l.length > 0);
      t.equal(cleanedLines.length, 4);
      t.equal(cleanedLines[1], '\\mt1 USFM');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Keep chapters (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      let fp = '../test_data/usfm/frt.usfm';
      let content = fse.readFileSync(path.resolve(__dirname, fp));
      let cleanedLines = pk.cleanUsfm(content)
        .split('\n')
        .filter(l => l.length > 0);
      t.equal(cleanedLines.length, 5);
      t.equal(cleanedLines[1], '\\mt1 USFM');
      t.equal(cleanedLines[3], '\\c 1');
    } catch (err) {
      console.log(err);
    }
  },
);
