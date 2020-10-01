const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Succinct Block";

const pk = pkWithDoc("../test_data/usx/web_rut.usx", "eng", "ust")[0];

test(
    `Byte Length (${testGroup})`,
    async function (t) {
        const lengths = {
            cByteLength: 202,
            bgByteLength: 0,
            osByteLength: 9,
            isByteLength: 6
        };
        t.plan(2 + Object.keys(lengths).length);
        const query = '{ documents { mainSequence { succinctBlocks { cByteLength bgByteLength osByteLength isByteLength } } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        const block = result.data.documents[0].mainSequence.succinctBlocks[1];
        t.ok("succinctBlocks" in result.data.documents[0].mainSequence);
        for (const [field, value] of Object.entries(lengths)) {
            t.equal(block[field], value);
        }
    }
);