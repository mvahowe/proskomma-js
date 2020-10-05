const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Introduction";

const pk = pkWithDoc("../test_data/usx/not_nfc18_phm.usx", "fra", "hello")[0];

test(
    `Introduction (${testGroup})`,
    async function (t) {
        try {
            t.plan(11);
            const query = '{ documents { sequences { id type blocks { bg { type, sequenceId } bs { label } text } } mainSequence { id } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const sequences = result.data.documents[0].sequences;
            const mainSequence = sequences.filter(s => s.id === result.data.documents[0].mainSequence.id)[0];
            t.equal(sequences.length, 4);
            t.equal(mainSequence.blocks[0].bg.length, 3);
            t.equal(mainSequence.blocks[0].bg[0].type, "title");
            t.equal(mainSequence.blocks[0].bg[1].type, "introduction");
            t.equal(mainSequence.blocks[0].bg[2].type, "heading");
            const introSequence = sequences.filter(s => s.type === "introduction")[0];
            t.equal(introSequence.blocks.length, 4);
            t.equal(introSequence.blocks[0].bs.label.split("/")[1], "imt");
            t.equal(introSequence.blocks[1].bs.label.split("/")[1], "ip");
            t.equal(introSequence.blocks[2].bs.label.split("/")[1], "is");
            t.equal(introSequence.blocks[3].bs.label.split("/")[1], "ip");
        } catch (err) {
            console.log(err)
        }
    }
);