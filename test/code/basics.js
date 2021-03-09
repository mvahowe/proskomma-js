const test = require('tape');

const { ProsKomma } = require('../../src');
const {
  pkWithDoc,
  pkWithDocs,
} = require('../lib/load');

const testGroup = 'Graph Basics';

const [pk, pkDoc] = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'ust',
});
const pk2 = pkWithDocs([
  ['../test_data/usx/web_rut.usx', {
    lang: 'eng',
    abbr: 'webbe',
  }],
  ['../test_data/usx/web_psa150.usx', {
    lang: 'eng',
    abbr: 'webbe',
  }],
  ['../test_data/usfm/ust_psa.usfm', {
    lang: 'eng',
    abbr: 'ust',
  }],
  ['../test_data/usx/not_nfc18_phm.usx', {
    lang: 'eng',
    abbr: 'nnfc18',
  }],
]);

test(
  `Scalar Root Fields (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const query = '{ id processor packageVersion nDocSets nDocuments }';
      const pk = new ProsKomma();
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data);
      t.ok('processor' in result.data);
      t.ok('packageVersion' in result.data);
      t.equal(result.data.packageVersion, pk.packageVersion());
      t.ok('nDocSets' in result.data);
      t.equal(result.data.nDocSets, 0);
      t.ok('nDocuments' in result.data);
      t.equal(result.data.nDocuments, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `DocSets (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ docSets { id lang: selector(id:"lang") abbr: selector(id:"abbr") } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.docSets[0]);
      t.equal(result.data.docSets[0].lang, 'eng');
      t.equal(result.data.docSets[0].abbr, 'ust');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `DocSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = `{ docSet(id: "${pkDoc.docSetId}") { id lang: selector(id:"lang") abbr: selector(id:"abbr") documents { id } } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.docSet);
      t.equal(result.data.docSet.lang, 'eng');
      t.equal(result.data.docSet.abbr, 'ust');
      t.ok('id' in result.data.docSet.documents[0]);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter docSets by IDs (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = `{ docSets(ids: ["${pkDoc.docSetId}"]) { id lang: selector(id:"lang") abbr: selector(id:"abbr") documents { id } } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.docSets[0]);
      t.equal(result.data.docSets[0].lang, 'eng');
      t.equal(result.data.docSets[0].abbr, 'ust');
      t.ok('id' in result.data.docSets[0].documents[0]);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter docSets by withBooks (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = `{ docSets(withBook: "PSA") { id lang: selector(id:"lang") selector(id:"abbr") document(bookCode: "PSA") { id header(id:"bookCode")} } }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 2);
      t.equal(result.data.docSets[0].document.header, 'PSA');
      t.equal(result.data.docSets[1].document.header, 'PSA');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Documents (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = '{ documents { id } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.documents[0]);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = `{ document(id: "${pkDoc.id}") { id } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.document);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter documents by id (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const query = `{ documents(ids: ["${pkDoc.id}"]) { id } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.documents[0]);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter documents by withBook (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = `{ documents(withBook:"PSA") { id header(id:"bookCode") } }`;
      const result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 2);
      t.equal(result.data.documents[0].header, 'PSA');
      t.equal(result.data.documents[1].header, 'PSA');
    } catch (err) {
      console.log(err);
    }
  },
);