const test = require('tape');
const {utils} = require("../../../../dist/index");

const testGroup = "Graft Defs";

test(
    `Get an Id (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            t.equal(utils.graftDefs.graftLocation["footnote"], "inline");
        } catch (err) {
            console.log(err)
        }
    }
);
