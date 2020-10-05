const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Tables";

const pk = pkWithDoc("../test_data/usx/table.usx", "fra", "hello")[0];

test(
    `USX (${testGroup})`,
    async function (t) {
        try {
            t.plan(8);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { scopeLabels bs { label } c ${itemFragment} } } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const blocks = result.data.documents[0].mainSequence.blocks;
            t.equal(blocks.length, 6);
            t.equal(blocks[0].bs.label, "blockTag/p1");
            t.equal(blocks[1].bs.label, "blockTag/tr1");
            t.ok(blocks[1].scopeLabels.includes("cell/body/left/2"));
            t.ok(blocks[2].scopeLabels.includes("cell/body/left/1"));
            t.ok(blocks[2].scopeLabels.includes("cell/body/right/1"));
            t.equal(blocks[5].bs.label, "blockTag/p1");
        } catch (err) {
            console.log(err)
        }
    }
);