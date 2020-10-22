const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Headings";

const pk = pkWithDoc("../test_data/usfm/rems.usfm", "fra", "hello")[0];

test(
    `REMs (${testGroup})`,
    async function (t) {
        try {
            t.plan(4);
            const query = '{ documents { sequences { id type blocks { bg { subType, sequenceId } text } } mainSequence { id } } }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const sequences = {};
            for (const seq of result.data.documents[0].sequences) {
                sequences[seq.id] = seq;
            }
            const mainSequence = sequences[result.data.documents[0].mainSequence.id];
            t.equal(mainSequence.blocks[0].bg.length, 1);
            t.equal(mainSequence.blocks[0].bg[0].subType, "remark");
            t.equal(sequences[mainSequence.blocks[0].bg[0].sequenceId].blocks[0].text, "Need to finish this sentence");
        } catch (err) {
            console.log(err)
        }
    }
);