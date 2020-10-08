const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Lexing Badness";

const pk = pkWithDoc("../test_data/usfm/backslash.usfm", "fra", "hello")[0];
const pk2 = pkWithDoc("../test_data/usfm/unknown.usfm", "fra", "hello")[0];

test(
    `Bare Backslash (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { c ${itemFragment} } } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const firstItem = result.data.documents[0].mainSequence.blocks[0].c[0];
            t.equal(firstItem.subType, "bareSlash");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Unknown (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { c ${itemFragment} } } } }`;
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            const firstItem = result.data.documents[0].mainSequence.blocks[0].c[0];
            t.equal(firstItem.subType, "unknown");
        } catch (err) {
            console.log(err)
        }
    }
);