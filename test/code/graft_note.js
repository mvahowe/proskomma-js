const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Graft Notes";

const pk = pkWithDoc("../test_data/usfm/footnote.usfm", "fra", "hello")[0];
const pk2 = pkWithDoc("../test_data/usfm/xref.usfm", "fra", "hello")[0];

test(
    `Footnote (${testGroup})`,
    async function (t) {
        try {
            const expectedScopes = [
                ["s", "inline/f"],
                ["s", "span/ft"],
                ["e", "span/ft"],
                ["s", "span/fqa"],
                ["e", "span/fqa"],
                ["s", "span/ft"],
                ["e", "span/ft"],
                ["s", "span/fqa"],
                ["e", "span/fqa"],
                ["s", "span/ft"],
                ["e", "span/ft"],
                ["e", "inline/f"]
            ];
            t.plan(3 + (2 * expectedScopes.length));
            const itemFragment = '{ ... on Token { subType chars dump } ... on Scope { subType label dump } ... on Graft { type sequenceId dump } }';
            const query = `{ documents { sequences { id type blocks { dump c ${itemFragment} } } mainSequence { id } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const sequences = {};
            for (const seq of result.data.documents[0].sequences) {
                sequences[seq.id] = seq;
            }
            const mainSequence = sequences[result.data.documents[0].mainSequence.id];
            t.equal(mainSequence.blocks.length, 5);
            const footnoteCallerBlock = mainSequence.blocks[2];
            const footnoteGrafts = footnoteCallerBlock.c.filter(i => i.type === "footnote");
            t.equal(footnoteGrafts.length, 1);
            const footnoteItems = sequences[footnoteGrafts[0].sequenceId].blocks[0].c;
            const scopes = footnoteItems.filter(i => i.subType && i.subType.endsWith("Scope"));
            let count = 0;
            for (const [sOrE, expectedLabel] of expectedScopes) {
                t.equal(scopes[count].subType, sOrE === "s" ? "startScope" : "endScope");
                t.equal(scopes[count].label, expectedLabel);
                count++;
            }
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `XRef (${testGroup})`,
    async function (t) {
        try {
            const expectedScopes = [
                ["s", "inline/x"],
                ["s", "span/xo"],
                ["e", "span/xo"],
                ["s", "span/xt"],
                ["e", "span/xt"],
                ["e", "inline/x"]
            ];
            t.plan(3 + (2 * expectedScopes.length));
            const itemFragment = '{ ... on Token { subType chars } ... on Scope { subType label } ... on Graft { type sequenceId } }';
            const query = `{ documents { sequences { id type blocks { c ${itemFragment} } } mainSequence { id } } }`;
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            const sequences = {};
            for (const seq of result.data.documents[0].sequences) {
                sequences[seq.id] = seq;
            }
            const mainSequence = sequences[result.data.documents[0].mainSequence.id];
            t.equal(mainSequence.blocks.length, 1);
            const xrefCallerBlock = mainSequence.blocks[0];
            const xrefGrafts = xrefCallerBlock.c.filter(i => i.type === "xref");
            t.equal(xrefGrafts.length, 1);
            const xrefItems = sequences[xrefGrafts[0].sequenceId].blocks[0].c;
            const scopes = xrefItems.filter(i => i.subType && i.subType.endsWith("Scope"));
            let count = 0;
            for (const [sOrE, expectedLabel] of expectedScopes) {
                t.equal(scopes[count].subType, sOrE === "s" ? "startScope" : "endScope");
                t.equal(scopes[count].label, expectedLabel);
                count++;
            }
        } catch (err) {
            console.log(err)
        }
    }
);