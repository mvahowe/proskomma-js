const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Print Numbers";

const pk = pkWithDoc("../test_data/usfm/cp_vp.usfm", "fra", "hello")[0];
const pk2 = pkWithDoc("../test_data/usx/pubnumber.usx", "fra", "hello")[0];

test(
    `USFM (${testGroup})`,
    async function (t) {
        try {
            const expectedScopes = [
                ["s", "chapter/3"],
                ["s", "printChapter/B"],
                ["s", "verse/14"],
                ["s", "verses/14"],
                ["s", "printVerse/1b"],
                ["e", "printVerse/1b"],
                ["e", "verses/14"],
                ["e", "verse/14"],
                ["s", "verse/15"],
                ["s", "verses/15"],
                ["s", "printVerse/2b"],
                ["e", "printChapter/B"],
                ["s", "printChapter/3bis"],
                ["e", "printVerse/2b"],
                ["s", "printVerse/14"],
                ["e", "printVerse/14"],
                ["e", "printChapter/3bis"],
                ["e", "verses/15"],
                ["e", "verse/15"],
                ["e", "chapter/3"]
            ];
            t.plan(1 + (expectedScopes.length * 2));
            const query =
                '{ documents { mainSequence { blocks { c { ... on Token { subType chars }... on Scope { subType label }... on Graft { type sequenceId } } } } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            const scopes = result.data.documents[0].mainSequence.blocks[0].c.filter(i => ["startScope", "endScope"].includes(i.subType));
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
    `USX (${testGroup})`,
    async function (t) {
        try {
            const expectedScopes = [
                ["s", "chapter/1"],
                ["s", "printChapter/A"],
                ["s", "altChapter/(A)"],
                ["s", "verse/1"],
                ["s", "verse/2"],
                ["s", "verses/1-2"],
                ["s", "printVerse/1-2"],
                ["s", "altVerse/1, 2"],
                ["e", "altVerse/1, 2"],
                ["e", "printVerse/1-2"],
                ["e", "verses/1-2"],
                ["e", "verse/2"],
                ["e", "verse/1"],
                ["s", "verse/3"],
                ["s", "verses/3"],
                ["s", "altVerse/(3)"],
                ["e", "altVerse/(3)"],
                ["e", "verses/3"],
                ["e", "verse/3"],
                ["e", "altChapter/(A)"],
                ["e", "printChapter/A"],
                ["e", "chapter/1"]
            ];
            t.plan(1 + (2 * expectedScopes.length));
            const query =
                '{ documents { mainSequence { blocks { c { ... on Token { subType chars }... on Scope { subType label }... on Graft { type sequenceId } } } } } }';
            const result = await pk2.gqlQuery(query);
            t.ok("data" in result);
            const scopes = result.data.documents[0].mainSequence.blocks[0].c.filter(i => ["startScope", "endScope"].includes(i.subType));
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