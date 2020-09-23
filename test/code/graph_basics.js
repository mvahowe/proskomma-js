const test = require('tape');
const { runQuery } = require('../../graph');

const testGroup = "Graph Basics";

test(
    `Processor Info (${testGroup})`,
    async function (t) {
        t.plan(5);
        const query = '{ processor version }';
        const result = await runQuery(query);
        t.ok("data" in result);
        t.ok("processor" in result.data);
        t.equal(result.data.processor, "Proskomma");
        t.ok("version" in result.data);
        t.equal(result.data.version, "0.1.0");

    }
);
