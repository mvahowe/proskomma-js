const test = require('tape');

const {pkWithDocs, pkWithDocSetDocs} = require('../lib/load');

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
            t.plan(2 + (3 * expected.length));
            const pk = pkWithDocs([
                ["../test_data/usfm/hello.usfm", {lang: "fra", abbr: "hello"}],
                ["../test_data/usfm/cp_vp.usfm", {lang: "fra", abbr: "cp_vp"}]
            ]);
            const query = '{ docSets { lang: selector(id:"lang") abbr: selector(id:"abbr") documents { id } } }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.docSets.length, 2);
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

test(
    `Documents (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            const pk = pkWithDocSetDocs(
                [
                    "../test_data/usfm/hello.usfm",
                    "../test_data/usfm/cp_vp.usfm"
                ],
                {lang: "eng", abbr: "ust"},
                {}
            )[0];
            const query = '{ docSets { lang: selector(id:"lang") abbr: selector(id:"abbr") documents { header(id:"id") mainSequence { blocks { text } } } } }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const documents = result.data.docSets[0].documents;
            t.ok(documents[0].header.startsWith("MRK"));
            t.ok(documents[0].mainSequence.blocks[0].text.startsWith("This is how"));
            t.ok(documents[1].header.startsWith("ESG"));
            t.ok(documents[1].mainSequence.blocks[0].text.startsWith("Here is the text"));
        } catch (err) {
            console.log(err)
        }
    }
);
