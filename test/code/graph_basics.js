const test = require('tape');

const {ProsKomma} = require('../../');
const {pkWithDoc} = require('../lib/load');

const testGroup = "Graph Basics";

const [pk, pkDoc] = pkWithDoc("../test_data/usx/web_rut.usx", "eng", "ust");

test(
    `Scalar Root Fields (${testGroup})`,
    async function (t) {
        try {
            t.plan(7);
            const query = '{ packageVersion nDocSets nDocuments }';
            const pk = new ProsKomma();
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("packageVersion" in result.data);
            t.equal(result.data.packageVersion, pk.packageVersion());
            t.ok("nDocSets" in result.data);
            t.equal(result.data.nDocSets, 0);
            t.ok("nDocuments" in result.data);
            t.equal(result.data.nDocuments, 0);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `DocSets (${testGroup})`,
    async function (t) {
        try {
            t.plan(4);
            const query = '{ docSets { id lang abbr } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("id" in result.data.docSets[0]);
            t.equal(result.data.docSets[0].lang, "eng");
            t.equal(result.data.docSets[0].abbr, "ust");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `DocSetById (${testGroup})`,
    async function (t) {
        try {
            t.plan(5);
            const query = `{ docSetById(id: "${pkDoc.docSetId}") { id lang abbr documents { id } } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("id" in result.data.docSetById);
            t.equal(result.data.docSetById.lang, "eng");
            t.equal(result.data.docSetById.abbr, "ust");
            t.ok("id" in result.data.docSetById.documents[0]);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Documents (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query = '{ documents { id } }';
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("id" in result.data.documents[0]);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `DocumentById (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query = `{ documentById(id: "${pkDoc.id}") { id } }`;
            const result = await pk.gqlQuery(query);
            t.ok("data" in result);
            t.ok("id" in result.data.documentById);
        } catch (err) {
            console.log(err)
        }
    }
);