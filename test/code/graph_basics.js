const test = require('tape');
const {runQuery} = require('../../graph');

const testGroup = "Graph Basics";

test(
    `Processor Info (${testGroup})`,
    async function (t) {
        t.plan(8);
        const query = '{ system { processor processorVersion succinctVersion } }';
        const result = await runQuery(query);
        t.ok("data" in result);
        t.ok("system" in result.data);
        t.ok("processor" in result.data.system);
        t.equal(result.data.system.processor, "Proskomma");
        t.ok("processorVersion" in result.data.system);
        t.equal(result.data.system.processorVersion, "0.1.0");
        t.ok("succinctVersion" in result.data.system);
        t.equal(result.data.system.succinctVersion, "0.1.0");
    }
);
