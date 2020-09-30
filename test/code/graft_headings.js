const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Headings";

const pk = pkWithDoc("../test_data/usfm/headings.usfm", "fra", "hello")[0];

test(
    `Headings (${testGroup})`,
    async function (t) {
        t.plan(6);
        const query = '{ documents { sequences { id type blocks { bg { type, sequenceId } text } } mainSequence { id } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        const sequences = {};
        for (const seq of result.data.documents[0].sequences) {
            sequences[seq.id] = seq;
        }
        const mainSequence = sequences[result.data.documents[0].mainSequence.id];
        t.equal(mainSequence.blocks[0].bg.length, 2);
        t.equal(mainSequence.blocks[0].bg[0].type, "title");
        t.equal(sequences[mainSequence.blocks[0].bg[0].sequenceId].blocks[0].text, "ACTS");
        t.equal(mainSequence.blocks[0].bg[1].type, "heading");
        t.equal(sequences[mainSequence.blocks[0].bg[1].sequenceId].blocks[0].text, "Prologue");
    }
);