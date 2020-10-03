const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Tables";

const pk = pkWithDoc("../test_data/usx/table.usx", "fra", "hello")[0];

test(
    `USX (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { c ${itemFragment} } } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const mainSequence = result.data.documents[0].mainSequence;
            // console.log(JSON.stringify(mainSequence, null, 2));
        } catch (err) {
            console.log(err)
        }
    }
);