const test = require('tape');
const {runQuery} = require('../../graph');
const { ProsKomma } = require('../../');

const testGroup = "Graph Basics";

test(
    `Processor Info (${testGroup})`,
    async function (t) {
        t.plan(6);
        const query = '{ system { processor packageVersion nDocSets } }';
        const result = await runQuery(query, {proskomma: new ProsKomma()});
        console.log(JSON.stringify(result))
        t.ok("data" in result);
        t.ok("system" in result.data);
        t.ok("processor" in result.data.system);
        t.equal(result.data.system.processor, "Proskomma");
        t.ok("packageVersion" in result.data.system);
        t.equal(result.data.system.packageVersion, "0.1.0");
    }
);
