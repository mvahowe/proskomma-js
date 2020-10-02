const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Hello USFM";

const pk = pkWithDoc("../test_data/usfm/hello.usfm", "fra", "hello")[0];

test(
    `Headers (${testGroup})`,
    async function (t) {
        const expectedHeaders = [
            ["id", "MRK Mark's Gospel, translated by Mark"],
            ["toc1", "The Gospel of Mark"],
            ["toc2", "Mark"],
            ["toc3", "Mk"]
        ];
        t.plan(5 + (2 * expectedHeaders.length));
        const query = '{ documents { headers { key value } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        const queryHeaders = result.data.documents[0].headers;
        t.equal(queryHeaders.length, expectedHeaders.length);
        for (const [expectedKey, expectedValue] of expectedHeaders) {
            const queryTuple = queryHeaders.filter(kv => kv.key === expectedKey);
            t.ok(queryTuple.length === 1);
            t.ok(queryTuple[0].value === expectedValue);
        }
        const query2 = '{documents { toc1: header(id:"toc1") toc3: header(id:"toc3") } }';
        const result2 = await pk.gqlQuery(query2);
        t.ok("data" in result2);
        t.equal(result2.data.documents[0].toc1, "The Gospel of Mark");
        t.equal(result2.data.documents[0].toc3, "Mk");
    }
);

test(
    `One-Block Sequence (${testGroup})`,
    async function (t) {
        t.plan(6);
        const query =
            '{ documents { sequences { type blocks { bs { label } text } } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        const sequences = result.data.documents[0].sequences;
        t.equal(sequences.length, 1);
        t.equal(sequences[0].type, "main");
        t.equal(sequences[0].blocks.length, 1);
        t.equal(sequences[0].blocks[0].bs.label, "blockTag/p");
        const expectedText = "This is how the Good News of JC began...";
        t.equal(sequences[0].blocks[0].text, expectedText);
    }
);

test(
    `One Chapter and Verse (${testGroup})`,
    async function (t) {
        t.plan(6);
        const query =
            '{ documents { sequences { type blocks { os { label } is { label } } } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        const block = result.data.documents[0].sequences[0].blocks[0];
        t.equal(block.os.length, 0);
        t.equal(block.is.length, 3);
        t.equal(block.is[0].label, "chapter/1");
        t.equal(block.is[1].label, "verse/1");
        t.equal(block.is[2].label, "verses/1");
    }
);