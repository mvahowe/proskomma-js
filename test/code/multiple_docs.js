const test = require('tape');

const {pkWithDocs} = require('../lib/load');

const testGroup = "Multiple Content";

test(
    `DocSets (${testGroup})`,
    async function (t) {
        try {
            const expected = [
                {
                    "lang": "fra",
                    "abbr": "hello",
                    "nDocs": 1
                },
                {
                    "lang": "fra",
                    "abbr": "cp_vp",
                    "nDocs": 1
                }
            ]
            t.plan(1 + (3 * expected.length));
            const pk = pkWithDocs([
                ["../test_data/usfm/hello.usfm", "fra", "hello"],
                ["../test_data/usfm/cp_vp.usfm", "fra", "cp_vp"]
            ]);
            const query = '{ docSets { lang abbr documents { id } } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            for (const [n, docSet] of result.data.docSets.entries()) {
                t.equal(docSet.lang, expected[n].lang);
                t.equal(docSet.abbr, expected[n].abbr);
                t.equal(docSet.documents.length, expected[n].nDocs);
            }
        } catch (err) {
            console.log(err)
        }
    }
);
