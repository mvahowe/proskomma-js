const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Serialize";

const pk = pkWithDoc("../test_data/usx/web_rut.usx", {lang: "fra", abbr: "hello"})[0];

test(
    `WEB RUT (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query = '{ docSets { id } }';
            const result = await pk.gqlQuery(query);
            const docSetId = result.data.docSets[0].id;
            const serialized = pk.serializeSuccinct(docSetId);
            t.ok(serialized);
            const wordLikes = pk.docSets[docSetId].unpackEnum("wordLike");
            t.ok(wordLikes.includes("Ruth"));
        } catch (err) {
            console.log(err)
        }
    }
);
