const test = require('tape');
const {pkWithDoc} = require('../lib/load');

const pk = pkWithDoc("../test_data/usx/web_rut.usx", {lang: "eng", abbr: "ust"}, {}, {}, [], ["frob"])[0];
pk.docSetList()[0].tags.add("foo");

const testGroup = "Graph Tags";

test(
    `DocSet (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            const query = '{ docSets { tags hasFoo: hasTag(tagName:"foo") hasBaa: hasTag(tagName:"baa")} }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const docSet = result.data.docSets[0];
            t.equal(docSet.tags.length, 1);
            t.ok(docSet.tags.includes("foo"));
            t.ok(docSet.hasFoo);
            t.false(docSet.hasBaa);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Document (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            const query = '{ docSets { documents { tags hasFrob: hasTag(tagName:"frob") hasBrof: hasTag(tagName:"brof")} } }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const document = result.data.docSets[0].documents[0];
            t.equal(document.tags.length, 1);
            t.ok(document.tags.includes("frob"));
            t.ok(document.hasFrob);
            t.false(document.hasBrof);
        } catch (err) {
            console.log(err)
        }
    }
);