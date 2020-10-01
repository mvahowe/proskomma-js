const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Document";

const [pk, pkDoc] = pkWithDoc("../test_data/usx/web_rut.usx", "eng", "ust");

test(
    `DocSetId (${testGroup})`,
    async function (t) {
        t.plan(3);
        const query = '{ documents { docSetId } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        t.ok("documents" in result.data);
        t.ok("docSetId" in result.data.documents[0]);
    }
);

test(
    `Headers (${testGroup})`,
    async function (t) {
            t.plan(6);
            const query = '{ documents { headers { key value }  toc1: header(id:"toc1") } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("documents" in result.data);
            t.ok("headers" in result.data.documents[0]);
            t.equal(result.data.documents[0].headers.length, 6);
            t.equal(result.data.documents[0].headers.filter(h => h.key === "toc1")[0].value, "The Book of Ruth");
            t.equal(result.data.documents[0].toc1, "The Book of Ruth");
    }
);

test(
    `mainSequence (${testGroup})`,
    async function (t) {
            t.plan(4);
            const query = '{ documents { mainSequence { id } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("documents" in result.data);
            t.ok("mainSequence" in result.data.documents[0]);
            t.ok("id" in result.data.documents[0].mainSequence);
    }
);

test(
    `Sequences (${testGroup})`,
    async function (t) {
            t.plan(4);
            const query = '{ documents { sequences { id } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("documents" in result.data);
            t.ok("sequences" in result.data.documents[0]);
            t.ok("id" in result.data.documents[0].sequences[0]);
    }
);