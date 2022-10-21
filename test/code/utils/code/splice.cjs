const test = require('tape');

const {utils} = require("../../../../dist/index");
const ByteArray = utils.ByteArray;
const { pushSuccinctTokenBytes, pushSuccinctGraftBytes, pushSuccinctScopeBytes } = utils.succinct;

const testGroup = 'Splice';

test(
    `Delete Item (${testGroup})`,
    function (t) {
        try {
            t.plan(4);
            const ba = new ByteArray(1);
            pushSuccinctTokenBytes(ba, 1, 299);
            pushSuccinctGraftBytes(ba, 10, 143);
            pushSuccinctScopeBytes(ba, 3, 2, [567]);
            const firstLength = ba.byte(0) & 0x0000003F;
            const secondLength = ba.byte(firstLength) & 0x0000003F;
            const thirdLength = ba.byte(firstLength + secondLength) & 0x0000003F;
            t.equal(firstLength + secondLength + thirdLength, ba.length);
            ba.deleteItem(firstLength);
            const newFirstLength = ba.byte(0) & 0x0000003F;
            const newSecondLength = ba.byte(newFirstLength) & 0x0000003F;
            t.equal(firstLength, newFirstLength);
            t.equal(thirdLength, newSecondLength);
            t.equal(newFirstLength + newSecondLength, ba.length);
        } catch (err) {
            console.log(err);
        }
    },
);

test(
    `Insert (${testGroup})`,
    function (t) {
        try {
            t.plan(7);
            const ba = new ByteArray(8);
            pushSuccinctTokenBytes(ba, 1, 299);
            pushSuccinctScopeBytes(ba, 3, 2, [567]);
            const tokenLength = ba.byte(0) & 0x0000003F;
            const scopeLength = ba.byte(tokenLength) & 0x0000003F;
            t.equal(tokenLength + scopeLength, ba.length);
            const iba = new ByteArray(1);
            pushSuccinctGraftBytes(iba, 10, 143);
            ba.insert(tokenLength, iba);
            const firstLength = ba.byte(0) & 0x0000003F;
            const secondLength = ba.byte(firstLength) & 0x0000003F;
            const thirdLength = ba.byte(firstLength + secondLength) & 0x0000003F;
            t.equal(firstLength, tokenLength);
            t.equal(secondLength, iba.length);
            t.equal(thirdLength, scopeLength);
            t.equal(firstLength + secondLength + thirdLength, ba.length);
            const iba2 = new ByteArray(1);
            pushSuccinctGraftBytes(iba2, 5, 47);
            ba.insert(firstLength + secondLength + thirdLength, iba2);
            const fourthLength = ba.byte(firstLength + secondLength + thirdLength) & 0x0000003F;
            t.equal(fourthLength, iba2.length);
            t.equal(firstLength + secondLength + thirdLength + fourthLength, ba.length);
        } catch (err) {
            console.log(err);
        }
    },
);
