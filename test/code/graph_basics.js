const test = require('tape');
const {runQuery} = require('../../graph');

const testGroup = "Graph Basics";

test(
    `Processor Info (${testGroup})`,
    async function (t) {
        t.plan(6);
        const query = '{ system { processor packageVersion } }';
        const result = await runQuery(query);
        t.ok("data" in result);
        t.ok("system" in result.data);
        t.ok("processor" in result.data.system);
        t.equal(result.data.system.processor, "Proskomma");
        t.ok("packageVersion" in result.data.system);
        t.equal(result.data.system.packageVersion, "0.1.0");
    }
);
