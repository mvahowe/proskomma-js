const test = require('tape');
const {utils} = require("../../../../dist/index");
const ByteArray = utils.ByteArray;

const testGroup = 'Byte Array';

test(
  `Construct (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      t.doesNotThrow(() => new ByteArray());
      t.doesNotThrow(() => new ByteArray(10));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Push, Read Byte (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      const ba = new ByteArray(1);
      t.throws(() => ba.byte(0));
      ba.pushByte(99);
      t.equal(ba.byte(0), 99);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Write Byte (${testGroup})`,
  function (t) {
    try {
      t.plan(4);
      const ba = new ByteArray(1);
      ba.pushByte(93);
      t.equal(ba.byte(0), 93);
      t.throws(() => ba.setByte(99, 3));
      ba.setByte(0, 27);
      t.equal(ba.byte(0), 27);
      t.throws(() => ba.setByte(0, 500));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Push, Read Bytes (${testGroup})`,
  function (t) {
    try {
      t.plan(5);
      const ba = new ByteArray(10);
      t.throws(() => ba.pushBytes('banana'));
      ba.pushBytes([2, 4, 6, 8]);
      t.equal(ba.byte(0), 2);
      t.equal(ba.byte(2), 6);
      t.equal(ba.bytes(1, 3)[2], 8);
      t.throws(() => ba.bytes(1, 99));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Write Bytes (${testGroup})`,
  function (t) {
    try {
      t.plan(3);
      const ba = new ByteArray(5);
      ba.pushBytes([2, 4, 6, 8]);
      t.equal(ba.byte(0), 2);
      ba.setBytes(1, [3, 5, 7]);
      t.throws(() => ba.setBytes(99, [1, 2]));
      t.equal(ba.byte(2), 5);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Grow (${testGroup})`,
  function (t) {
    try {
      t.plan(6);
      const ba = new ByteArray(5);
      ba.pushBytes([2, 4, 6, 8, 10]);
      t.equal(ba.length, 5);
      t.equal(ba.byteArray.length, 5);
      ba.pushByte(12);
      t.equal(ba.byteArray.length, 21);
      t.equal(ba.length, 6);
      t.equal(ba.byte(0), 2);
      t.equal(ba.byte(5), 12);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
    `NByte (${testGroup})`,
    function (t) {
        try {
            t.plan(7);
            const ba = new ByteArray();
            ba.pushNByte(127);
            t.equal(ba.byte(0), 127 + 128);
            t.equal(ba.nByte(0), 127);
            ba.pushNByte(130);
            t.equal(ba.byte(1), 2);
            t.equal(ba.byte(2), 1 + 128);
            t.equal(ba.nByte(1), 130);
            t.throws(() => ba.pushNByte('banana'));
            t.throws(() => ba.nByte(99));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `NBytes (${testGroup})`,
    function (t) {
        try {
            t.plan(6);
            const ba = new ByteArray();
            ba.pushNByte(127);
            ba.pushNByte(17000);
            ba.pushNByte(130);
            const nBytes = ba.nBytes(0, 3);
            t.equal(nBytes.length, 3);
            t.equal(nBytes[0], 127);
            t.equal(nBytes[1], 17000);
            t.equal(nBytes[2], 130);
            t.equal(ba.nBytes(0, 0).length, 0);
            t.throws(() => ba.nBytes(0, 4));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `pushNBytes (${testGroup})`,
    function (t) {
        try {
            t.plan(5);
            const ba = new ByteArray();
            ba.pushNBytes([127, 17000, 130]);
            const nBytes = ba.nBytes(0, 3);
            t.equal(nBytes.length, 3);
            t.equal(nBytes[0], 127);
            t.equal(nBytes[1], 17000);
            t.equal(nBytes[2], 130);
            t.throws(() => ba.pushNBytes([1, "2", 3]));
        } catch (err) {
            console.log(err);
        }
    },
);

test(
  `Counted String (${testGroup})`,
  function (t) {
    try {
      t.plan(9);
      let ba = new ByteArray();
      ba.pushCountedString('abc');
      t.equal(ba.byte(0), 3);
      t.equal(ba.byte(1), 'a'.charCodeAt(0));
      t.equal(ba.countedString(0), 'abc');
      ba = new ByteArray();
      ba.pushCountedString('égale');
      t.equal(ba.byte(0), 6);
      t.equal(ba.byte(3), 'g'.charCodeAt(0));
      t.equal(ba.countedString(0), 'égale');
      ba = new ByteArray();
      const musicalChar = String.fromCodePoint(0x1D11E);
      ba.pushCountedString(musicalChar);
      t.equal(ba.byte(0), 4);
      t.equal(ba.countedString(0), musicalChar);
      ba = new ByteArray();
      const hebrew = 'וּ⁠בְ⁠דֶ֣רֶך';
      ba.pushCountedString(hebrew);
      t.equal(ba.countedString(0), hebrew);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Clear (${testGroup})`,
  function (t) {
    try {
      t.plan(3);
      let ba = new ByteArray();
      ba.pushCountedString('abc');
      t.equal(ba.countedString(0), 'abc');
      ba.clear();
      t.equal(ba.byteArray[0], 0);
      t.equal(ba.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `nByteLength (${testGroup})`,
  function (t) {
    try {
      t.plan(5);
      let ba = new ByteArray();
      ba.pushNByte((2 ** 7) - 1);
      ba.pushNByte(2 ** 7);
      ba.pushNByte(2 ** 14);
      ba.pushNByte(2 ** 21);
      t.equal(ba.nByteLength(ba.nByte(0)), 1);
      t.equal(ba.nByteLength(ba.nByte(1)), 2);
      t.equal(ba.nByteLength(ba.nByte(3)), 3);
      t.equal(ba.nByteLength(ba.nByte(6)), 4);
      t.throws(() => ba.nByteLength(128 ** 4));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Trim (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      let ba = new ByteArray(256);
      ba.pushCountedString('abc');
      t.equal(ba.byteArray.length, 256);
      ba.trim();
      t.equal(ba.byteArray.length, 4);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Base64 (${testGroup})`,
  function (t) {
    try {
      t.plan(3);
      let ba = new ByteArray();
      ba.pushCountedString('abc');
      ba.trim();
      let ba2 = new ByteArray();
      ba2.fromBase64(ba.base64());
      t.equal(ba2.byteArray.length, 4);
      t.equal(ba2.length, 4);
      t.equal(ba2.countedString(0), 'abc');
    } catch (err) {
      console.log(err);
    }
  },
);
