const test = require('tape');

const {ProsKomma} = require('../../');
const { pkWithDoc } = require('../lib/load');

const testGroup = "Graph Basics";

const [pk, pkDoc] = pkWithDoc("../test_data/usx/web_psa.usx","eng", "ust");

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
        t.plan(2);
        let query = `{ docSetById(id: "${pkDoc.docSetId}")
           { documents 
              { id mainSequence 
                 { blocks 
                    {
                       dump
                    }
                 }
              }
           }
        }`;
        let result = await pk.gqlQuery(query);
        // console.log(JSON.stringify(result, null, 2));
        t.ok(result);
        query = `{ docSetById(id: "${pkDoc.docSetId}")
           { documents 
              { id mainSequence 
                 { blocks 
                    {
                       bg { type sequenceId }
                       bs { label }
                       os { label }
                       is { label }
                       scopeLabels
                       c
                       {
                          ... on Token
                             { subType chars }
                          ... on Scope
                             { subType label }
                          ... on Graft
                             { type sequenceId }
                       }
                    }
                 }
              }
           }
        }`;
        result = await pk.gqlQuery(query);
        // console.log(JSON.stringify(result, null, 2));
        t.ok(result);
    }
);

test(
    `HTML (${testGroup})`,
    async function (t) {
        t.plan(1);
        let query = `{ docSetById(id: "${pkDoc.docSetId}")
           { documents 
              { mainSequence 
                 { htmlHead
                   blocks {
                      html
                   }
                   htmlFoot
                 }
              }
           }
        }`;
        let result = await pk.gqlQuery(query);
        // console.log(JSON.stringify(result, null, 2));
        let sequence = result.data.docSetById.documents[0].mainSequence;
        // console.log(JSON.stringify(result, null, 2));
        t.ok(result);
        let html = `${sequence.htmlHead}${sequence.blocks.map(b => b.html).join('')}${sequence.htmlFoot}`;
        // console.log(html);
    }
);

test(
    `Blocks for Scopes (${testGroup})`,
    async function (t) {
        t.plan(1);
        let query = `{ docSetById(id: "${pkDoc.docSetId}")
           { documents 
              { mainSequence
                 { htmlHead
                   blocksForScopes(scopes:["chapter/23", "verse/4"]) {
                   html
                  }
                  htmlFoot
                 }
              }
           }
        }`;
        let result = await pk.gqlQuery(query);
        // console.log(JSON.stringify(result, null, 2));
        let sequence = result.data.docSetById.documents[0].mainSequence;
        // console.log(JSON.stringify(result, null, 2));
        t.ok(result);
        let html = `${sequence.htmlHead}${sequence.blocksForScopes.map(b => b.html).join('')}${sequence.htmlFoot}`;
        console.log(html);
    }
);
