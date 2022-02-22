const test = require('tape');

const { Proskomma } = require('../../src');
const {
  pkWithDoc,
  pkWithDocs,
} = require('../lib/load');

const testGroup = 'Graph Basics';

const [pk, pkDoc] = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
});
const pk2 = pkWithDocs([
  ['../test_data/usx/web_psa150.usx', {
    lang: 'eng',
    abbr: 'webbe',
  }],
  ['../test_data/usx/web_rut.usx', {
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

const pk3 = pkWithDocs([
  ['../test_data/usx/web_rut.usx', {
    lang: 'eng',
    abbr: 'webbe',
  }],
  ['../test_data/usfm/web_ecc.usfm', {
    lang: 'eng',
    abbr: 'webbe',
  }],
  ['../test_data/usx/web_psa150.usx', {
    lang: 'eng',
    abbr: 'webbe',
  }],
]);

test(
  `Scalar Root Fields (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const query = '{ id processor packageVersion nDocSets nDocuments }';
      const pk = new Proskomma();
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
  `Sync query (${testGroup})`,
  function (t) {
    try {
      t.plan(2);
      const query = '{ id }';
      const pk = new Proskomma();
      const result = pk.gqlQuerySync(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data);
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
      t.equal(result.data.docSets[0].abbr, 'web');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sort DocSet Documents (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = '{ docSets { documents(sortedBy:"paratext") { bookCode: header(id:"bookCode") } } }';
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].documents[0].bookCode, 'RUT');
      t.equal(result.data.docSets[0].documents[2].bookCode, 'ECC');
      query = '{ docSets { documents(sortedBy:"alpha") { bookCode: header(id:"bookCode") } } }';
      result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].documents[0].bookCode, 'ECC');
      t.equal(result.data.docSets[0].documents[2].bookCode, 'RUT');
      query = '{ docSets { documents(sortedBy:"banana") { bookCode: header(id:"bookCode") } } }';
      result = await pk3.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.includes('banana'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `nDocuments in docSet (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ docSets { nDocuments } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('nDocuments' in result.data.docSets[0]);
      t.equal(result.data.docSets[0].nDocuments, 1);
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
      t.equal(result.data.docSet.abbr, 'web');
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
      t.equal(result.data.docSets[0].abbr, 'web');
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
  `Filter docSets documents by withChars (${testGroup})`,
  async function (t) {
    try {
      const docSetDocuments = ds => ds
        .map(ds => ds.documents)
        .reduce((a, b) => a.concat(b));
      t.plan(5);
      let query = `{ docSets { documents(withChars: ["Boaz" "banana"]) { id header(id:"bookCode")} } }`;
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      let documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 1);
      t.equal(documents[0].header, 'RUT');
      query = `{ docSets { documents(withChars: ["Boaz" "banana"] allChars: true) { id header(id:"bookCode")} } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter docSets documents by withMatchingChars (${testGroup})`,
  async function (t) {
    try {
      const docSetDocuments = ds => ds
        .map(ds => ds.documents)
        .reduce((a, b) => a.concat(b));
      t.plan(5);
      let query = `{ docSets { documents(withMatchingChars: ["boaz" "banana"]) { id header(id:"bookCode")} } }`;
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      let documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 1);
      t.equal(documents[0].header, 'RUT');
      query = `{ docSets { documents(withMatchingChars: ["boaz" "banana"] allChars: true) { id header(id:"bookCode")} } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter docSets documents by withScopes (${testGroup})`,
  async function (t) {
    try {
      const docSetDocuments = ds => ds
        .map(ds => ds.documents)
        .reduce((a, b) => a.concat(b));
      t.plan(4);
      let query = `{ docSets { documents(withScopes: ["blockTag/p" "blockTag/q" "blockTag/q2"]) { id header(id:"bookCode")} } }`;
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      let documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 4);
      query = `{ docSets { documents(withScopes: ["blockTag/q" "blockTag/q2"] allScopes:true) { id header(id:"bookCode")} } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 2);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter docSets documents by withHeaderValues (${testGroup})`,
  async function (t) {
    try {
      const docSetDocuments = ds => ds
        .map(ds => ds.documents)
        .reduce((a, b) => a.concat(b));
      t.plan(8);
      let query = `{ docSets { documents(withHeaderValues: { key: "bookCode" value: "PSA" }) { id } } }`;
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      let documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 2);
      query = `{ docSets { documents(withHeaderValues: { key: "ide" value: "UTF-8" }) { id } } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 3);
      query = `{ docSets { documents(withHeaderValues: { key: "ide" value: "EDBIC" }) { id } } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 0);
      query = `{ docSets { documents(withHeaderValues: { key: "banana" value: "split" }) { id } } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      documents = docSetDocuments(result.data.docSets);
      t.equal(documents.length, 0);
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
  `Sort Documents (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      let query = '{ documents(sortedBy:"paratext") { bookCode: header(id:"bookCode") } }';
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents[0].bookCode, 'RUT');
      t.equal(result.data.documents[3].bookCode, 'PHM');
      query = '{ documents(sortedBy:"banana") { bookCode: header(id:"bookCode") } }';
      result = await pk2.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.includes('banana'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Document (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      let query = `{ document(id: "${pkDoc.id}") { id } }`;
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.document);
      query = `{ document(withBook: "RUT" docSetId: "${pkDoc.docSetId}") { id } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.document);
      query = `{ document(withBook: "XYZ" docSetId: "${pkDoc.docSetId}") { id } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok(!result.data.document);
      query = `{ document(withBook: "RUT") { id } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.includes('but not all three'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter documents by id (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = `{ documents(ids: ["${pkDoc.id}"]) { id } noDocs: documents(ids: ["abc"]) { id }}`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.documents[0]);
      t.equal(result.data.noDocs.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Filter docSet documents by id (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = `{ docSet(id: "${pkDoc.docSetId}") { documents(ids: ["${pkDoc.id}"]) { id } noDocs: documents(ids: ["abc"]) { id } } }`;
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('id' in result.data.docSet.documents[0]);
      t.equal(result.data.docSet.noDocs.length, 0);
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

test(
  `Filter documents by withHeaderValues (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let query = `{ documents(withHeaderValues:{key: "bookCode" value: "PSA" }) { id } }`;
      let result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 2);
      query = `{ documents(withHeaderValues:{key: "bookCode" value: "RUT" }) { id } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 1);
      query = `{ documents(withHeaderValues:{key: "ide" value: "UTF-8" }) { id } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 3);
      query = `{ documents(withHeaderValues:{key: "ide" value: "EDBIC" }) { id } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 0);
      query = `{ documents(withHeaderValues:{key: "banana" value: "split" }) { id } }`;
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.documents.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Enum index for string (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        '{' +
        '  docSets {' +
        '    boaz: enumIndexForString(enumType:"wordLike" searchString:"Boaz")' +
        '    banana: enumIndexForString(enumType:"wordLike" searchString:"Banana")' +
        '  }' +
        '}';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok(result.data.docSets[0].boaz > 0);
      t.equal(result.data.docSets[0].banana, -1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Enum regex indexes for string (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query =
        '{' +
        '  docSets {' +
        '    kin: enumRegexIndexesForString(enumType:"wordLike" searchRegex:"kinsm[ae]n") { index matched }' +
        '    banana: enumRegexIndexesForString(enumType:"wordLike" searchRegex:"Banana") { index matched }' +
        '  }' +
        '}';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets[0].kin.length, 2);
      t.equal(result.data.docSets[0].banana.length, 0);
      // console.log(JSON.stringify(result.data, null, 2));
    } catch (err) {
      console.log(err);
    }
  },
);
