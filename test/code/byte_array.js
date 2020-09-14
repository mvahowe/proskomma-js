const test = require('tape');


test(
    'Construct',
    function (t) {
        const ByteArray = require('../../lib/byte_array');
        t.plan(2);
        t.doesNotThrow(() => new ByteArray());
        t.doesNotThrow(() => new ByteArray(10));
    }
);

test(
    'Push, Read Byte',
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
    'Write Byte',
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
    'Push, Read Bytes',
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
    'Write Bytes',
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
