const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Title";

const pk = pkWithDoc("../test_data/usx/not_nfc18_phm.usx", "fra", "hello")[0];

test(
    `Title (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            const query = '{ documents { sequences { id type blocks { bg { type, sequenceId } bs { label } text } } mainSequence { id } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const sequences = result.data.documents[0].sequences;
            const mainSequence = sequences.filter(s => s.id === result.data.documents[0].mainSequence.id)[0];
            t.equal(mainSequence.blocks[0].bg[0].type, "title");
            const titleSequence = sequences.filter(s => s.type === "title")[0];
            t.equal(titleSequence.blocks.length, 2);
            t.equal(titleSequence.blocks[0].bs.label.split("/")[1], "mt2");
            t.equal(titleSequence.blocks[1].bs.label.split("/")[1], "mt");
        } catch (err) {
            console.log(err)
        }
    }
);