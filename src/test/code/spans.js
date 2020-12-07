const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Spans";

const pk = pkWithDoc("../test_data/usfm/spans.usfm", {lang: "fra", abbr: "hello"})[0];

test(
    `Spans via Dump (${testGroup})`,
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

test(
    `Spans via items with context (${testGroup})`,
    async function (t) {
        try {
            t.plan(8);
            const query =
                `{ documents { mainSequence { blocks { tokens(includeContext:true) { subType chars position scopes } } } } }`;
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const joel = result.data.documents[0].mainSequence.blocks[0].tokens.filter(t => t.chars === "Joel")[0];
            t.ok("position" in joel);
            t.ok("scopes" in joel);
            for (const scope of ["chapter/1", "verse/1", "verses/1", "span/it", "span/bd"]) {
                t.ok(joel.scopes.includes(scope));
            }
        } catch (err) {
            console.log(err)
        }
    }
);