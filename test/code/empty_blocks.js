const test = require('tape');

const { ProsKomma } = require('../..');
const { pkWithDoc, customPkWithDoc } = require('../lib/load');

const testGroup = "Empty Blocks";

const pk = pkWithDoc("../test_data/usfm/en_ust_psa_1.usfm", "fra", "hello")[0];

const customProsKomma = class extends ProsKomma {

    constructor() {
        super();
        this.filters = {};
        this.customTags = {
            heading: [],
            paragraph: [],
            char: [],
            word: [],
            intro: [],
            introHeading: []
        };
        this.emptyBlocks = ["blockTag/s5", "blockTag/m"];
    }

}

const customPk = customPkWithDoc(customProsKomma, "../test_data/usfm/en_ust_psa_1.usfm", "fra", "hello", {})[0];

const query = `{ documents { sequences { type blocks { bg { subType sequenceId } bs { label } text } } } }`;

test(
    `Without Custom (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const sequences = result.data.documents[0].sequences;
            t.equal(sequences.filter(s => s.type === "heading").length, 0);
            t.equal(sequences.filter(s => s.type === "main")[0].blocks[0].bs.label, "blockTag/q");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `With Custom (${testGroup})`,
    async function (t) {
        try {
            t.plan(4);
            const result = await customPk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const sequences = result.data.documents[0].sequences;
            t.equal(sequences.filter(s => s.type === "heading").length, 3);
            t.equal(sequences.filter(s => s.type === "heading" && s.blocks[0].bs.label === "blockTag/s5").length, 3);
            t.equal(sequences.filter(s => s.type === "main")[0].blocks[0].bs.label, "blockTag/m");
        } catch (err) {
            console.log(err)
        }
    }
);
