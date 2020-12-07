const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Lexicon";

test(
    `Query by Strongs and Lemma (${testGroup})`,
    async function (t) {
        try {
            t.plan(7);
            let pk;
            t.doesNotThrow(() => pk = pkWithDoc("../test_data/lexicon/dodson.xml", {lang: "fra", abbr: "hello"})[0]);
            let query = '{' +
                '  documents {' +
                '    mainSequence {' +
                '      blocks(withScopes:["attribute/milestone/zlexentry/x-strongs/0/G0008"]) {' +
                '        bs { label }' +
                '        text' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            let result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.documents[0].mainSequence.blocks.length, 3);
            t.equal(result.data.documents[0].mainSequence.blocks[1].text, "Abiathar");
            query = '{' +
                '  documents {' +
                '    mainSequence {' +
                '      blocks(withScopes:["attribute/milestone/zlexentry/x-lemma/0/Ἀβιαθάρ"]) {' +
                '        bs { label }' +
                '        text' +
                '      }' +
                '    }' +
                '  }' +
                '}';
            result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.equal(result.data.documents[0].mainSequence.blocks.length, 3);
            t.equal(result.data.documents[0].mainSequence.blocks[1].text, "Abiathar");
        } catch (err) {
            console.log(err)
        }
    }
);