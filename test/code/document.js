const test = require('tape');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph Document';

const [pk, pkDoc] = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'ust',
});

test(
  `DocSetId (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const query = '{ documents { docSetId } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('docSetId' in result.data.documents[0]);
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `Headers (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query = '{ documents { headers { key value }  toc: header(id:"toc") } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('headers' in result.data.documents[0]);
      t.equal(result.data.documents[0].headers.length, 7);
      t.equal(result.data.documents[0].headers.filter(h => h.key === 'toc')[0].value, 'The Book of Ruth');
      t.equal(result.data.documents[0].toc, 'The Book of Ruth');
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `mainSequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainSequence { id } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('mainSequence' in result.data.documents[0]);
      t.ok('id' in result.data.documents[0].mainSequence);
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `Sequences (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { sequences { id } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sequences' in result.data.documents[0]);
      t.ok('id' in result.data.documents[0].sequences[0]);
    } catch
      (err) {
      console.log(err);
    }
  },
);

test(
  `Sequences (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { sequences { id } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sequences' in result.data.documents[0]);
      t.ok('id' in result.data.documents[0].sequences[0]);
    } catch
      (err) {
      console.log(err);
    }
  },
);