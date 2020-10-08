const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Lexing Breaks";

const pk = pkWithDoc("../test_data/usfm/no_break_space.usfm", "fra", "hello")[0];
const pk2 = pkWithDoc("../test_data/usfm/soft_line_break.usfm", "fra", "hello")[0];

test(
    `NBSP (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { c ${itemFragment} } } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const secondItem = result.data.documents[0].mainSequence.blocks[0].c[1];
            t.equal(secondItem.subType, "lineSpace");
            t.equal(secondItem.chars, '\xa0');
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Soft line break (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { c ${itemFragment} } } } }`;
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            const secondItem = result.data.documents[0].mainSequence.blocks[0].c[1];
            t.equal(secondItem.subType, "softLineBreak");
            t.equal(secondItem.chars, '//');
        } catch (err) {
            console.log(err)
        }
    }
);