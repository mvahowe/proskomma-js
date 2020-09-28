const test = require('tape');
const fse = require('fs-extra');
const path = require('path');

const {runQuery} = require('../../graph');
const {ProsKomma} = require('../../');

const testGroup = "Graph Basics";

test(
    `Root (${testGroup})`,
    async function (t) {
        t.plan(7);
        const query = '{ packageVersion nDocSets nDocuments }';
        const pk = new ProsKomma();
        const result = await pk.gqlQuery(query);
        console.log(JSON.stringify(result, null, 2));
        t.ok("data" in result);
        t.ok("packageVersion" in result.data);
        t.equal(result.data.packageVersion, "0.1.0");
        t.ok("nDocSets" in result.data);
        t.equal(result.data.nDocSets, 0);
        t.ok("nDocuments" in result.data);
        t.equal(result.data.nDocuments, 0);
    }
);

const usx = fse.readFileSync(path.resolve(__dirname, '../test_data/usx/web_psa.usx'));
const pk = new ProsKomma();
const pkDoc = pk.importDocument(
    "eng",
    "ust",
    "usx",
    usx,
    {}
);

test(
    `DocSets (${testGroup})`,
    async function (t) {
        t.plan(1);
        const query = '{ docSetList { id lang abbr } }';
        const result = await pk.gqlQuery(query);
        console.log(JSON.stringify(result, null, 2));
        t.ok(result);
    }
);

test(
    `DocSetById (${testGroup})`,
    async function (t) {
        t.plan(1);
        const query = `{ docSetById(id: "${pkDoc.docSetId}") { id lang abbr } }`;
        const result = await pk.gqlQuery(query);
        console.log(JSON.stringify(result, null, 2));
        t.ok(result);
    }
);

test(
    `Documents (${testGroup})`,
    async function (t) {
        t.plan(1);
        const query = '{ documentList { id } }';
        const result = await pk.gqlQuery(query);
        console.log(JSON.stringify(result, null, 2));
        t.ok(result);
    }
);

test(
    `DocumentById (${testGroup})`,
    async function (t) {
        t.plan(1);
        const query = `{ documentById(id: "${pkDoc.id}") { id } }`;
        const result = await pk.gqlQuery(query);
        console.log(JSON.stringify(result, null, 2));
        t.ok(result);
    }
);

test(
    `DocSet Documents (${testGroup})`,
    async function (t) {
        t.plan(1);
        const query = `{ docSetById(id: "${pkDoc.docSetId}")
           { id documents 
              { id mainSequence 
                 { id type nBlocks blocks 
                    {
                       dump
                    }
                 }
              docSetId
              }
           }
        }`;
        const result = await pk.gqlQuery(query);
        console.log(JSON.stringify(result, null, 2));
        t.ok(result);
    }
);

/*
c
                       {
                          ... on Token
                             { dump }
                          ... on Scope
                             { dump }
                          ... on Graft
                             { dump }
                       }
* */
