const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Tables";

const pk = pkWithDoc("../test_data/usx/table.usx", "fra", "hello")[0];
const pk2 = pkWithDoc("../test_data/usfm/table.usfm", "fra", "hello")[0];

const checkResult = (t, result) => {
    const blocks = result.data.documents[0].mainSequence.blocks;
    t.equal(blocks.length, 6);
    t.equal(blocks[0].bs.label, "blockTag/p");
    t.false(blocks[0].scopeLabels.includes("table"));
    t.equal(blocks[1].bs.label, "blockTag/tr");
    t.ok(blocks[1].scopeLabels.includes("cell/body/left/2"));
    t.ok(blocks[1].scopeLabels.includes("table"));
    t.ok(blocks[2].scopeLabels.includes("cell/body/left/1"));
    t.ok(blocks[2].scopeLabels.includes("cell/body/right/1"));
    t.equal(blocks[5].bs.label, "blockTag/p");
    t.false(blocks[5].scopeLabels.includes("table"));
}

const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
const query = `{ documents { mainSequence { blocks { scopeLabels bs { label } c ${itemFragment} } } } }`;

test(
    `USX (${testGroup})`,
    async function (t) {
        try {
            t.plan(11);
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            checkResult(t, result);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `USFM (${testGroup})`,
    async function (t) {
        try {
            t.plan(11);
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            checkResult(t, result);
        } catch (err) {
            console.log(err)
        }
    }
);