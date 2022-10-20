const test = require('tape');
const {utils} = require("../../../../dist/index");

const testGroup = "Generate ID";

test(
    `Get an Id (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            const id = utils.generateId();
            t.equal(id.length, 12);
        } catch (err) {
            console.log(err)
        }
    }
);
