const test = require('tape');

const { utils } = require('../../../../dist/index');
const ByteArray = utils.ByteArray;
const {
  pushSuccinctTokenBytes, pushSuccinctGraftBytes, pushSuccinctScopeBytes,
} = utils.succinct;

const testGroup = 'Push Succinct';

test(
  `Token (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      const ba = new ByteArray(1);
      pushSuccinctTokenBytes(ba, 2, 299);
      t.equal(ba.byte(1), 2);
      t.equal(ba.nByte(2), 299);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Graft (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      const ba = new ByteArray(1);
      pushSuccinctGraftBytes(ba, 10, 299);
      t.equal(ba.byte(1), 10);
      t.equal(ba.nByte(2), 299);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Scope (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      const ba = new ByteArray(1);
      pushSuccinctScopeBytes(ba, 3, 2, [567]);
      t.equal(ba.byte(1), 2);
      t.equal(ba.nByte(2), 567);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Scope missing args (${testGroup})`,
  function (t) {
    try {
      t.plan(3);
      const ba = new ByteArray(1);
      t.throws(() => pushSuccinctScopeBytes(ba, undefined, 2, [567]));
      t.throws(() => pushSuccinctScopeBytes(ba, 3, undefined, [567]));
      t.throws(() => pushSuccinctScopeBytes(ba, 3, 2, undefined));
    } catch (err) {
      console.log(err);
    }
  },
);
