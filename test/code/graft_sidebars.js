const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Sidebars";

const pkWithUSX = pkWithDoc("../test_data/usx/sidebars.usx", "fra", "hello")[0];
const pkWithUSFM = pkWithDoc("../test_data/usfm/sidebars.usfm", "fra", "hello")[0];

const doTest = async (t, pk) => {
    t.plan(9);
    const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
    const query = `{ documents { sequences { id type blocks { bs { label } bg { type, sequenceId } c ${itemFragment} text } } mainSequence { id } } }`;
    const result = await pk.gqlQuery(query);
    t.ok("data" in result);
    const sequences = {};
    for (const seq of result.data.documents[0].sequences) {
        sequences[seq.id] = seq;
    }
    const mainSequence = sequences[result.data.documents[0].mainSequence.id];
    t.equal(mainSequence.blocks.length, 2);
    t.equal(mainSequence.blocks[0].bg.length, 4);
    t.equal(mainSequence.blocks[0].bg[0].type, "title");
    t.equal(mainSequence.blocks[0].bg[1].type, "introduction");
    t.equal(mainSequence.blocks[0].bg[2].type, "sidebar");
    t.equal(mainSequence.blocks[0].bg[3].type, "heading");
    t.equal(mainSequence.blocks[1].bg.length, 1);
    t.equal(mainSequence.blocks[1].bg[0].type, "sidebar");
}

test(
    `USX (${testGroup})`,
    async function (t) {
        try {
            await doTest(t, pkWithUSX);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `USFM (${testGroup})`,
    async function (t) {
        try {
            await doTest(t, pkWithUSFM);
        } catch (err) {
            console.log(err)
        }
    }
);