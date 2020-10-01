const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Print Numbers";

const pk = pkWithDoc("../test_data/usfm/cp_vp.usfm", "fra", "hello")[0];

test(
    `CP (${testGroup})`,
    async function (t) {
            const expectedScopes = [
                    ["s", "chapter/3"],
                    ["s", "verse/14"],
                    ["s", "verses/14"],
                    ["s", "printVerse/1b"],
                    ["e", "verses/14"],
                    ["e", "verse/14"],
                    ["s", "verse/15"],
                    ["s", "verses/15"],
                    ["e", "printVerse/1b"],
                    ["s", "printVerse/2b"],
                    ["e", "printVerse/2b"],
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
    }
);