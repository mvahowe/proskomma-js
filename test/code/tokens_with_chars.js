const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Tokens withChars";

const pk = pkWithDoc("../test_data/usfm/ugnt_3jn.usfm", {lang: "fra", abbr: "hello"})[0];

test(
    `Find words (${testGroup})`,
    async function (t) {
        try {
            t.plan(4);
            const query =
                '{' +
                '  documents(withBook:"3JN") {' +
                '    mainSequence {' +
                '      blocks (withScriptureCV: "1:3") {' +
                '        tokens(' +
                '          includeContext:true' +
                '          withScriptureCV: "1:3"' +
                '          withChars: ["ἐρχομένων", "ἀδελφῶν"]' +
                '        ) {' +
                '          subType chars position scopes' +
                '        }' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const foundLemma = result.data.documents[0].mainSequence.blocks[0].tokens
                .map(t => t.scopes.filter(s => s.startsWith("attribute/spanWithAtts/w/lemma/0"))[0].split("/")[5]);
            t.equal(foundLemma.length, 2);
            for (const lemma of ["ἔρχομαι", "ἀδελφός"]) {
                t.ok(foundLemma.includes(lemma));
            }
        } catch (err) {
            console.log(err)
        }
    }
);