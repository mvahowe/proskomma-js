const test = require('tape');
const Validator = require('jsonschema').Validator;
const {serializedSchema, unpackEnum} = require('proskomma-utils');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Serialize";

const pk = pkWithDoc("../test_data/usx/web_rut.usx", {lang: "fra", abbr: "hello"})[0];

test(
    `WEB RUT (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query = '{ docSets { id } }';
            const result = await pk.gqlQuery(query);
            const docSetId = result.data.docSets[0].id;
            const serialized = pk.serializeSuccinct(docSetId);
            console.log(JSON.stringify(serialized, null, 2))
            t.ok(serialized);
            const validationReport = new Validator().validate(serialized, serializedSchema);
            console.log(validationReport.errors.map(e => ({
                "path": e.path,
                "message": e.message
            })));
            t.equal(validationReport.errors.length, 0);
            const wordLikes = unpackEnum(pk.docSets[docSetId].enums["wordLike"]);
            t.ok(wordLikes.includes("Ruth"));
        } catch (err) {
            console.log(err);
        }
    }
);
