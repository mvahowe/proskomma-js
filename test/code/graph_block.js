const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Block";

const pk = pkWithDoc("../test_data/usfm/hello.usfm", "eng", "ust")[0];
const pk2 = pkWithDoc("../test_data/usfm/headings.usfm", "eng", "ust")[0];
const pk3 = pkWithDoc("../test_data/usx/web_rut.usx", "eng", "ust")[0];

test(
    `Length (${testGroup})`,
    async function (t) {
        try {
            const lengths = {
                cLength: 26,
                bgLength: 0,
                osLength: 0,
                isLength: 3
            };
            t.plan(2 + Object.keys(lengths).length);
            const query = '{ documents { mainSequence { blocks { cLength bgLength osLength isLength } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("blocks" in result.data.documents[0].mainSequence);
            for (const [field, value] of Object.entries(lengths)) {
                t.equal(result.data.documents[0].mainSequence.blocks[0][field], value);
            }
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Render as Text (${testGroup})`,
    async function (t) {
        try {
            t.plan(6);
            const query = '{ documents { mainSequence { blocks { text dump html } } } }';
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.text, "Dear Theophilus,");
            t.ok(block.dump.includes("+verse/1+"));
            t.ok(block.html.includes("Dear Theophilus,"));
            t.ok(block.html.startsWith("<h3>"));
            t.ok(block.html.endsWith("</div>\n"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Scopes (${testGroup})`,
    async function (t) {
        try {
            const scopeLabels = [
                "chapter/1",
                "verse/1",
                "verses/1"
            ];
            t.plan(2 + scopeLabels.length);
            const query = '{ documents { mainSequence { blocks { scopeLabels bs { label } } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bs.label, "blockTag/p");
            for (const scopeLabel of scopeLabels) {
                t.ok(block.scopeLabels.includes(scopeLabel));
            }
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Grafts (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query = '{ documents { mainSequence { blocks { bg { subType sequenceId } } } } }';
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            const block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg[0].subType, "title");
            t.equal(block.bg[1].subType, "heading");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Items (${testGroup})`,
    async function (t) {
        try {
            const openScopes = [
                "chapter/1",
                "verse/9",
                "verses/9"
            ];
            t.plan(15 + openScopes.length);
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { itemType label } ... on Graft { subType sequenceId } }';
            const query = '{ documents { mainSequence { blocks {' +
                `c ${itemFragment}` +
                `bg {subType sequenceId}` +
                `os {itemType label}` +
                `is {itemType label}` +
                '} } } }';
            let result = await pk.gqlQuery(query);
            t.ok("data" in result);
            let block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.c[0].itemType, "startScope");
            t.equal(block.c[0].label, "chapter/1");
            t.equal(block.c[3].subType, "wordLike");
            t.equal(block.c[3].chars, "This");
            t.equal(block.os.length, 0);
            t.equal(block.bg.length, 0);
            t.equal(block.is.length, 3);
            t.equal(block.is[0].label, "chapter/1");
            result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            block = result.data.documents[0].mainSequence.blocks[0];
            t.equal(block.bg.length, 2);
            t.equal(block.bg[0].subType, "title");
            t.equal(block.bg[1].subType, "heading");
            result = await pk3.gqlQuery(query);
            t.ok("data" in result);
            block = result.data.documents[0].mainSequence.blocks[1];
            t.equal(block.os.length, 3);
            for (const openScope of openScopes) {
                t.ok(block.os.map(s => s.label).includes(openScope));
            }
        } catch (err) {
            console.log(err)
        }
    }
);
