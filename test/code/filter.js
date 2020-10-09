const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Filter on Parse";

test(
    `No Filter (${testGroup})`,
    async function (t) {
        try {
            const scopeLabels = [
                "chapter/1",
                "verse/1",
                "verses/1",
                "span/nd",
                "span/it",
                "span/bd"
            ];
            t.plan(5 + scopeLabels.length);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello")[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 2);
            t.equal(block.bg[0].type, "title");
            t.equal(block.bg[1].type, "heading");
            t.equal(block.scopeLabels.length, 6);
            for (const scopeLabel of scopeLabels) {
                t.ok(block.scopeLabels.includes(scopeLabel));
            }
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Exclude All Scopes (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {includeScopes: []})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 2);
            t.equal(block.scopeLabels.length, 0);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Exclude All Grafts (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {includeGrafts: []})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 0);
            t.equal(block.scopeLabels.length, 6);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Exclude Everything (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {includeGrafts: [], includeScopes: []})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 0);
            t.equal(block.scopeLabels.length, 0);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Exclude Nothing (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {excludeGrafts: [], excludeScopes: []})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 2);
            t.equal(block.scopeLabels.length, 6);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Include chapter/verse (${testGroup})`,
    async function (t) {
        try {
            const scopeLabels = [
                "chapter/1",
                "verse/1"
            ];
            t.plan(2 + scopeLabels.length);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {includeScopes: ["chapter", "verse/"]})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.scopeLabels.length, 2);
            for (const scopeLabel of scopeLabels) {
                t.ok(block.scopeLabels.includes(scopeLabel));
            }
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Exclude chapter/verse (${testGroup})`,
    async function (t) {
        try {
            const scopeLabels = [
                "verses/1",
                "span/nd",
                "span/it",
                "span/bd"
            ];
            t.plan(2 + scopeLabels.length);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {excludeScopes: ["chapter", "verse/"]})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.scopeLabels.length, 4);
            for (const scopeLabel of scopeLabels) {
                t.ok(block.scopeLabels.includes(scopeLabel));
            }
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Include Title (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {includeGrafts: ["title"]})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 1);
            t.equal(block.bg[0].type, "title");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Exclude Title (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const pk = pkWithDoc("../test_data/usfm/filter.usfm", "fra", "hello", {excludeGrafts: ["title"]})[0];
            const query =
                '{ documents { mainSequence { blocks { bg { type } bs { label } scopeLabels } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 1);
            t.equal(block.bg[0].type, "heading");
        } catch (err) {
            console.log(err)
        }
    }
);

