/* eslint-disable no-useless-escape */
/* eslint-disable no-return-assign */
const path = require('path');
const test = require('tape');
const fse = require('fs-extra');
const deepEqual = require('deep-equal');

const { Proskomma } = require('../../src');

const { pkWithDoc } = require('../lib/load');

const testGroup = 'Graph Document';

const pk = pkWithDoc('../test_data/usx/web_rut.usx', {
  lang: 'eng',
  abbr: 'web',
})[0];

const pk2 = new Proskomma();
const fp = '../test_data/usfm/int.usfm';
const content = fse.readFileSync(path.resolve(__dirname, fp));

pk2.importUsfmPeriph(
  { lang: 'eng', abbr: 'abc' },
  content,
  {},
);

const pk3 = pkWithDoc('../test_data/usfm/78-GALspavbl.usfm', {
  lang: 'spa',
  abbr: 'vbl',
})[0];

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
  `Headers with accents (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const query = '{ documents { headers { key value }  toc: header(id:"toc") } }';
      const result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('headers' in result.data.documents[0]);
      t.equal(result.data.documents[0].headers.length, 5);
      t.equal(result.data.documents[0].headers.filter(h => h.key === 'toc')[0].value, 'Gálatas');
      t.equal(result.data.documents[0].toc, 'Gálatas');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `ID Parts (${testGroup})`,
  async function (t) {
    try {
      t.plan(14);
      const query = '{ documents { idParts { type parts part(index:0) nullPart: part(index:9) } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let idParts = result.data.documents[0].idParts;
      t.equal(idParts.type, 'book');
      t.equal(idParts.parts.length, 2);
      t.equal(idParts.parts[0], 'RUT');
      t.equal(idParts.part, 'RUT');
      t.ok(!idParts.nullPart);
      result = await pk2.gqlQuery(query);
      t.equal(result.errors, undefined);
      idParts = result.data.documents[0].idParts;
      t.equal(idParts.type, 'periph');
      t.equal(idParts.parts.length, 4);
      t.equal(idParts.parts[0], 'P00');
      t.equal(idParts.parts[1], 'INT');
      t.equal(idParts.parts[2], 'intbible');
      t.equal(idParts.part, 'P00');
      t.ok(!idParts.nullPart);
    } catch (err) {
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
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequences by type and ids (${testGroup})`,
  async function (t) {
    try {
      t.plan(11);
      let query = '{ documents { sequences(types:"main") { id type } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sequences' in result.data.documents[0]);
      t.equal(result.data.documents[0].sequences.length, 1);
      const mainSequence = result.data.documents[0].sequences[0];
      t.equal(mainSequence.type, 'main');
      const mainId = mainSequence.id;
      query = `{ documents { sequences(ids:"${mainId}") { id type } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sequences' in result.data.documents[0]);
      t.equal(result.data.documents[0].sequences.length, 1);
      const foundSequence = result.data.documents[0].sequences[0];
      t.equal(foundSequence.id, mainId);
      t.equal(foundSequence.type, 'main');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Sequence (${testGroup})`,
  async function (t) {
    try {
      t.plan(10);
      let query = '{ documents { mainSequence { id } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const mainId = result.data.documents[0].mainSequence.id;
      query = `{ documents { sequence(id:"${mainId}") { id type } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sequence' in result.data.documents[0]);
      const foundSequence = result.data.documents[0].sequence;
      t.equal(foundSequence.id, mainId);
      t.equal(foundSequence.type, 'main');
      query = `{ documents { sequence(id:"banana") { id type } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sequence' in result.data.documents[0]);
      t.equal(result.data.documents[0].sequence, null);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `mainBlocks (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainBlocks { text } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('mainBlocks' in result.data.documents[0]);
      t.ok(result.data.documents[0].mainBlocks[0].text.startsWith('In the days when'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `mainBlocksText (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ documents { mainBlocksText normalized: mainBlocksText(normalizeSpace:true) } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('mainBlocksText' in result.data.documents[0]);
      t.ok(result.data.documents[0].mainBlocksText[0].startsWith('In the days when'));
      t.ok(result.data.documents[0].normalized[0].startsWith('In the days when'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `mainBlocksItems (${testGroup})`,
  async function (t) {
    try {
      t.plan(7);
      const query = '{ documents { mainBlocksItems { type subType payload } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('mainBlocksItems' in result.data.documents[0]);
      t.equal(result.data.documents[0].mainBlocksItems[0][0].payload, 'chapter/1');
      t.equal(result.data.documents[0].mainBlocksItems[0][1].payload, 'verse/1');
      t.equal(result.data.documents[0].mainBlocksItems[0][2].payload, 'verses/1');
      t.equal(result.data.documents[0].mainBlocksItems[0][3].payload, 'In');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `mainBlocksTokens (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const query = '{ documents { mainBlocksTokens { type subType payload } } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('mainBlocksTokens' in result.data.documents[0]);
      t.equal(result.data.documents[0].mainBlocksTokens[0][0].payload, 'In');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `mainText (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const query = '{ documents { mainText normalized: mainText(normalizeSpace:true) } }';
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('mainText' in result.data.documents[0]);
      t.ok(result.data.documents[0].mainText.startsWith('In the days when'));
      t.ok(result.data.documents[0].normalized.startsWith('In the days when'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `perf (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { perf } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('perf' in result.data.documents[0]);
      let perfJSON;
      t.doesNotThrow(() => perfJSON = JSON.parse(result.data.documents[0].perf));
      query = '{ documents { perf(indent:2) } }';
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('perf' in result.data.documents[0]);
      let perfJSON2;
      t.doesNotThrow(() => perfJSON2 = JSON.parse(result.data.documents[0].perf));
      t.ok(deepEqual(perfJSON, perfJSON2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `sofria (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      let query = '{ documents { sofria } }';
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sofria' in result.data.documents[0]);
      let sofriaJSON;
      t.doesNotThrow(() => sofriaJSON = JSON.parse(result.data.documents[0].sofria));
      query = '{ documents { sofria(indent:2) } }';
      result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('sofria' in result.data.documents[0]);
      let sofriaJSON2;
      t.doesNotThrow(() => sofriaJSON2 = JSON.parse(result.data.documents[0].sofria));
      t.ok(deepEqual(sofriaJSON, sofriaJSON2));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `usfm (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      let query = '{ documents { usfm } }';
      let result = await pk3.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('documents' in result.data);
      t.ok('usfm' in result.data.documents[0]);

      let rawUsfm = fse.readFileSync(path.resolve(__dirname, '../test_data/usfm/78-GALspavbl.usfm')).toString();
      let tabRawUsfm = rawUsfm.split(/(\\[a-z]+[\d\*]?|\n)/g).filter((e) => e !== '' && e !== ' ' && e !== '\n');

      let outputUsfm = result.data.documents[0].usfm;
      let tabOutputUsfm = outputUsfm.split(/(\\[a-z]+[\d\*]?|\n)/g).filter((e) => e !== '' && e !== ' ' && e !== '\n');

      let diff = [];

      tabRawUsfm.forEach((elem, i) => {
        if (!tabOutputUsfm[i] || elem.trim() != tabOutputUsfm[i].trim()) {
          diff.push([tabOutputUsfm[i], elem]);
        }
      });
      t.equal(diff.join(''), '');
    } catch (err) {
      console.log(err);
    }
  },
);