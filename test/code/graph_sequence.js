const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Sequence";

const [pk, pkDoc] = pkWithDoc("../test_data/usfm/hello.usfm", "eng", "ust");

test(
    `Scalars (${testGroup})`,
    async function (t) {
        t.plan(7);
        const query = '{ documents { mainSequence { id type nBlocks htmlHead htmlFoot } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        t.ok("mainSequence" in result.data.documents[0]);
        t.ok("id" in result.data.documents[0].mainSequence);
        t.equal(result.data.documents[0].mainSequence.type, "main");
        t.equal(result.data.documents[0].mainSequence.nBlocks, 1);
        t.ok(result.data.documents[0].mainSequence.htmlHead.startsWith("<html"));
        t.ok(result.data.documents[0].mainSequence.htmlFoot.endsWith("/html>\n"));
    }
);

test(
    `Blocks (${testGroup})`,
    async function (t) {
        t.plan(4);
        const query = '{ documents { mainSequence { blocks { text } } } }';
        const result = await pk.gqlQuery(query);
        t.ok("data" in result);
        t.ok("blocks" in result.data.documents[0].mainSequence);
        t.ok("text" in result.data.documents[0].mainSequence.blocks[0]);
        t.equal(result.data.documents[0].mainSequence.blocks[0].text, "This is how the Good News of JC began...");
    }
);

test(
    `BlocksForScopes (${testGroup})`,
    async function (t) {
        t.plan(7);
        let query = '{ documents { mainSequence { blocksForScopes(scopes:["chapter/1", "verse/1"]) { text } } } }';
        let result = await pk.gqlQuery(query);
        t.ok("data" in result);
        t.ok("blocksForScopes" in result.data.documents[0].mainSequence);
        t.equal(result.data.documents[0].mainSequence.blocksForScopes.length, 1);
        t.equal(result.data.documents[0].mainSequence.blocksForScopes[0].text, "This is how the Good News of JC began...");
        query = '{ documents { mainSequence { blocksForScopes(scopes:["chapter/1", "verse/2"]) { text } } } }';
        result = await pk.gqlQuery(query);
        t.ok("data" in result);
        t.ok("blocksForScopes" in result.data.documents[0].mainSequence);
        t.equal(result.data.documents[0].mainSequence.blocksForScopes.length, 0);
    }
);