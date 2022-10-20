const test = require('tape');
const {utils} = require("../../../../dist/index");

const testGroup = "Generate ID";

test(
    `Get an Id (${testGroup})`,
    async function (t) {
        try {
            t.plan(utils.canons.ptBookArray.length * 2);
            for (const ptBook of utils.canons.ptBookArray) {
                t.ok(ptBook.code in utils.canons.ptBooks);
                t.equal(ptBook.code, utils.canons.ptBooks[ptBook.code].code);
            }
        } catch (err) {
            console.log(err);
        }
    }
);
