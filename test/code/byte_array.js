const test = require('tape');

const testGroup = "Byte Array";

test(
    `Construct (${testGroup})`,
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(2);
        t.doesNotThrow(() => new ByteArray());
        t.doesNotThrow(() => new ByteArray(10));
    }
);

test(
    `Push, Read Byte (${testGroup})`,
    function (t) {
        t.plan(2);
        const ByteArray = require('../../lib/byte_array');
        const ba = new ByteArray(1);
        t.throws(()=>ba.byte(0));
        ba.pushByte(99);
        t.equal(ba.byte(0), 99);
    }
);

test(
    `Write Byte (${testGroup})`,
    function (t) {
        t.plan(2);
        const ByteArray = require('../../lib/byte_array');
        const ba = new ByteArray(1);
        ba.pushByte(93);
        t.equal(ba.byte(0), 93);
        ba.setByte(0, 27);
        t.equal(ba.byte(0), 27);
    }
);

test(
    `Push, Read Bytes (${testGroup})`,
    function (t) {
        t.plan(3);
        const ByteArray = require('../../lib/byte_array');
        const ba = new ByteArray(10);
        ba.pushBytes([2, 4, 6, 8]);
        t.equal(ba.byte(0), 2);
        t.equal(ba.byte(2), 6);
        t.equal(ba.bytes(1, 3)[2], 8);
    }
);

test(
    `Write Bytes (${testGroup})`,
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(2);
        const ba = new ByteArray(5);
        ba.pushBytes([2, 4, 6, 8]);
        t.equal(ba.byte(0), 2);
        ba.setBytes(1, [3, 5, 7]);
        t.equal(ba.byte(2), 5);
    }
);

test(
    `Grow (${testGroup})`,
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(6);
        const ba = new ByteArray(5);
        ba.pushBytes([2, 4, 6, 8, 10]);
        t.equal(ba.length, 5);
        t.equal(ba.byteArray.length, 5);
        ba.pushByte(12);
        t.equal(ba.byteArray.length, 10);
        t.equal(ba.length, 6);
        t.equal(ba.byte(0), 2);
        t.equal(ba.byte(5), 12);
    }
);

test(
    `NByte (${testGroup})`,
    function (t) {
            const ByteArray = require('../../lib/byte_array');
            t.plan(5);
            const ba = new ByteArray();
            ba.pushNByte(127);
            t.equal(ba.byte(0), 127 + 128);
            t.equal(ba.nByte(0), 127);
            ba.pushNByte(130);
            t.equal(ba.byte(1), 2);
            t.equal(ba.byte(2), 1 + 128);
            t.equal(ba.nByte(1), 130);
    }
);

test(
    `Counted String (${testGroup})`,
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(9);
        let ba = new ByteArray();
        ba.pushCountedString("abc");
        t.equal(ba.byte(0), 3);
        t.equal(ba.byte(1), "a".charCodeAt(0));
        t.equal(ba.countedString(0), "abc");
        ba = new ByteArray();
        ba.pushCountedString("égale");
        t.equal(ba.byte(0), 6);
        t.equal(ba.byte(3), "g".charCodeAt(0));
        t.equal(ba.countedString(0), "égale");
        ba = new ByteArray();
        const musicalChar = String.fromCodePoint(0x1D11E);
        ba.pushCountedString(musicalChar);
        t.equal(ba.byte(0), 4);
        t.equal(ba.countedString(0), musicalChar);
        ba = new ByteArray();
        const hebrew = "וּ⁠בְ⁠דֶ֣רֶך";
        ba.pushCountedString(hebrew);
        t.equal(ba.countedString(0), hebrew);
    }
);

test(
    `Clear (${testGroup})`,
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(3);
        let ba = new ByteArray();
        ba.pushCountedString("abc");
        t.equal(ba.countedString(0), "abc");
        ba.clear();
        t.equal(ba.byteArray[0], 0);
        t.equal(ba.length, 0);
    }
);

test(
    `nByteLength (${testGroup})`,
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(4);
        let ba = new ByteArray();
        ba.pushNByte((2 ** 7) - 1);
        ba.pushNByte(2 ** 7);
        ba.pushNByte(2 ** 14);
        ba.pushNByte(2 ** 21);
        t.equal(ba.nByteLength(ba.nByte(0)), 1);
        t.equal(ba.nByteLength(ba.nByte(1)), 2);
        t.equal(ba.nByteLength(ba.nByte(3)), 3);
        t.equal(ba.nByteLength(ba.nByte(6)), 4);
    }
);

test(
    `Trim (${testGroup})`,
    function (t) {
            const ByteArray = require('../../lib/byte_array');
            t.plan(1);
            let ba = new ByteArray();
            ba.pushCountedString("abc");
            ba.trim();
            t.equal(ba.length, 4);
    }
);
