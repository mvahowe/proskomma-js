const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Spans";

const pk = pkWithDoc("../test_data/usfm/spans.usfm", {lang: "fra", abbr: "hello"})[0];

test(
    `Spans Within a Block (${testGroup})`,
    async function (t) {
        try {
            t.plan(4);
            const query =
                '{ documents { mainSequence { blocks { dump } } } }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.ok(block.dump.includes("+span/nd+|Lord-span/nd-"));
            t.ok(block.dump.includes("+span/it++span/bd+|Joel-span/bd-"));
            t.ok(block.dump.includes("Pethuel-span/it-"));
        } catch (err) {
            console.log(err)
        }
    }
);