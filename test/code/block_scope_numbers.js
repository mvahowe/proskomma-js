const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Block Scopes";

const pk = pkWithDoc("../test_data/usfm/ust_psa.usfm", "fra", "hello")[0];

test(
    `Numbers (${testGroup})`,
    async function (t) {
        try {
            const bsScopes = ["q", "q", "q2", "q", "q2", "q", "q2", "q", "q2", "q", "q2", "q", "q"];
            t.plan(1 + bsScopes.length);
            const query =
                '{ documents { mainSequence { blocks { bs { label } } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const blocks = result.data.documents[0].mainSequence.blocks;
            for (const [n, block] of blocks.entries()) {
                t.equal(block.bs.label, `blockTag/${bsScopes[n]}`);
            }
        } catch (err) {
            console.log(err)
        }
    }
);