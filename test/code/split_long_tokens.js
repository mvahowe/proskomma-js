const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Split Long Tokens";

const pk = pkWithDoc("../test_data/usfm/split_long_tokens.usfm", "fra", "hello")[0];

test(
    `300-Char Word (${testGroup})`,
    async function (t) {
        try {
            t.plan(6);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { mainSequence { blocks { c ${ itemFragment } } } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const words = result.data.documents[0].mainSequence.blocks[0].c.filter(i => i.subType === "wordLike");
            t.equal(words.length, 4);
            t.equal(words[0].chars.length, 127);
            t.equal(words[1].chars.length, 127);
            t.equal(words[2].chars.length, 46);
            t.equal(words[3].chars.length, 3);
        } catch (err) {
            console.log(err)
        }
    }
);