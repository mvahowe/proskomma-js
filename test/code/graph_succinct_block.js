const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Succinct Block";

const pk = pkWithDoc("../test_data/usx/web_rut_1.usx", "eng", "ust")[0];

test(
    `Byte Length (${testGroup})`,
    async function (t) {
        try {
            const lengths = [
                {
                    cByteLength: 1734,
                    bgByteLength: 9,
                    osByteLength: 0,
                    isByteLength: 57
                },
                {
                    cByteLength: 198,
                    bgByteLength: 0,
                    osByteLength: 9,
                    isByteLength: 6
                }
            ];
            t.plan(2 + (lengths.length * Object.keys(lengths[0]).length));
            const query = '{ documents { mainSequence { succinctBlocks { cByteLength bgByteLength osByteLength isByteLength } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("succinctBlocks" in result.data.documents[0].mainSequence);
            for (const blockNo of [0, 1]) {
                const block = result.data.documents[0].mainSequence.succinctBlocks[blockNo];
                for (const [field, value] of Object.entries(lengths[blockNo])) {
                    t.equal(block[field], value);
                }
            }
        } catch (err) {
            console.log(err)
        }
    }
);