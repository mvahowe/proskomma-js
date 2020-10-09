const test = require('tape');
const {labelForScope, nComponentsForScope} = require("../../lib/scope_defs");

const testGroup = "Scope Def Edge Cases";

test(
    `labelForScope (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            t.equal(labelForScope("orphanTokens"), "orphanTokens");
            t.equal(labelForScope("hangingGraft"), "hangingGraft");
            t.throws(() => labelForScope("banana"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `nComponentsForScope (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            t.throws(() => nComponentsForScope("banana"));
        } catch (err) {
            console.log(err)
        }
    }
);

