const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Succinct Block";

const pk = pkWithDoc("../test_data/usx/web_rut_1.usx", "eng", "ust")[0];

const checkLengthResult = async (t, query, lengths) => {
    const result = await pk.gqlQuery(query);
    t.ok("data" in result);
    t.ok("succinctBlocks" in result.data.documents[0].mainSequence);
    for (const blockNo of [0, 1]) {
        const block = result.data.documents[0].mainSequence.succinctBlocks[blockNo];
        for (const [field, value] of Object.entries(lengths[blockNo])) {
            t.equal(block[field], value);
        }
    }
}

test(
    `Byte Length (${testGroup})`,
    async function (t) {
        try {
            const lengths = [
                {
                    cBL: 1734,
                    bgBL: 9,
                    osBL: 0,
                    isBL: 57
                },
                {
                    cBL: 198,
                    bgBL: 0,
                    osBL: 9,
                    isBL: 6
                }
            ];
            t.plan(2 + (lengths.length * Object.keys(lengths[0]).length));
            const query = '{ documents { mainSequence { succinctBlocks { cBL bgBL osBL isBL } } } }';
            await checkLengthResult(t, query, lengths);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Item Length (${testGroup})`,
    async function (t) {
        try {
            const lengths = [
                {
                    cL: 578,
                    bgL: 3,
                    osL: 0,
                    isL: 19
                },
                {
                    cL: 66,
                    bgL: 0,
                    osL: 3,
                    isL: 2
                }
            ];
            t.plan(2 + (lengths.length * Object.keys(lengths[0]).length));
            const query = '{ documents { mainSequence { succinctBlocks { cL bgL osL isL } } } }';
            await checkLengthResult(t, query, lengths);
        } catch (err) {
            console.log(err)
        }
    }
);