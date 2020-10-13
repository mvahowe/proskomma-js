const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Sidebars";

const pkWithUSX = pkWithDoc("../test_data/usx/sidebars.usx", "fra", "hello")[0];
const pkWithUSFM = pkWithDoc("../test_data/usfm/sidebars.usfm", "fra", "hello")[0];

const doTest = async (t, pk) => {
    t.plan(1);
    const query = '{ documents { sequences { id type blocks { bg { type, sequenceId } text } } mainSequence { id } } }';
    const result = await pk.gqlQuery(query);
    t.ok("data" in result);
    const sequences = {};
    for (const seq of result.data.documents[0].sequences) {
        sequences[seq.id] = seq;
    }
    const mainSequence = sequences[result.data.documents[0].mainSequence.id];
    console.log(JSON.stringify(mainSequence, null, 2));
}
/*
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

 */

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