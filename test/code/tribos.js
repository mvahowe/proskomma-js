const path = require('path');
const test = require('tape');

const fse = require('fs-extra');
const { Proskomma } = require('../../src');

const importNodes1 = (pk, filePath) => {
  pk.importDocument({
    lang: 'deu',
    abbr: 'xyz',
  }, 'nodes',
  fse.readFileSync(path.resolve(__dirname, filePath)),
  {},
  );
};

const importGenealogyNodes = pk => importNodes1(pk, '../test_data/tree/genealogy.json');
const importJudeNodes = pk => importNodes1(pk, '../test_data/tree/jude.json');

const testGroup = 'Tribos';

test(
  `nodes by id (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{0, 4}") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 2);
      t.equal(tribos.data[0].id, '0');
      t.equal(tribos.data[1].id, '4');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `root node (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"root") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      t.equal(tribos.data[0].id, '0');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `nodes (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"nodes") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 7);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `children (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"root/children") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 2);
      t.equal(tribos.data[0].id, '1');
      t.equal(tribos.data[1].id, '4');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `child by index (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"root/children(1)") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      t.equal(tribos.data[0].id, '4');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `descendants (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"root/descendants(2)") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 4);
      t.equal(tribos.data[0].id, '2');
      t.equal(tribos.data[2].id, '5');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `descendants by index (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"root/descendants(2, 3)") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      t.equal(tribos.data[0].id, '6');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `leaves (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"root/leaves") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 4);
      t.equal(tribos.data[0].id, '2');
      t.equal(tribos.data[2].id, '5');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `parent (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{6}/parent") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      t.equal(tribos.data[0].id, '4');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `ancestor (${testGroup})`,
  async function (t) {
    try {
      t.plan(5);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{6}/ancestor(1)") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      t.equal(tribos.data[0].id, '4');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `siblings (${testGroup})`,
  async function (t) {
    try {
      t.plan(6);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{6}/siblings") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 2);
      t.equal(tribos.data[0].id, '5');
      t.equal(tribos.data[1].id, '6');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `node (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{4}/node") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      const node = tribos.data[0];
      t.equal(node.id, '4');
      t.equal(node.parentId, '0');
      t.equal(Object.keys(node.content).length, 3);
      t.equal(node.content.label, 'pop');
      t.equal(node.children, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `node with field spec (${testGroup})`,
  async function (t) {
    try {
      t.plan(16);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{4}/node{children, @shoeSize, children}") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      let tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      let node = tribos.data[0];
      t.equal(node.id, undefined);
      t.equal(node.parentId, undefined);
      t.equal(Object.keys(node.content).length, 1);
      t.equal(node.content.shoeSize, '91');
      t.equal(node.children.length, 2);
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"#{4}/node{id, parentId, content}") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.errors, undefined);
      t.equal(tribos.data.length, 1);
      node = tribos.data[0];
      t.equal(node.id, '4');
      t.equal(node.parentId, '0');
      t.equal(Object.keys(node.content).length, 3);
      t.equal(node.children, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Predicate (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"nodes[or(==(parentId, '4'), ==(id, '1'))]/node") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Quotes (${testGroup})`,
  async function (t) {
    try {
      t.plan(4);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"nodes[contains(concat('f(o\\\\'o', '79', ')))'), content('shoeSize'))]/node") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 1);
      t.equal(tribos.data[0].id, '6');
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `hasContent (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;
      query = `{documents { treeSequence(id:"${treeSequenceId}") { tribos(query:"nodes[and(hasContent('shoeSize'), not(hasContent('banana')))]/node") } } }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 7);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `string booleans (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[or(startsWith(content('name'), 'Sally'), endsWith(content('name'), 'Jones'), matches(content('name'), 'eborah'))]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `int <=> string (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[and(!=(int(content('shoeSize')), 79), !=(content('shoeSize'), string(91)))]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 5);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `string operators (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[or(==(right(content('label'), 2), 'ma'), ==(left(content('label'), 2), 'po'), ==(indexOf(content('name'), 'Smith n'), 6), ==(length(content('name')), 23))]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 4);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `nChildren (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[==(nChildren, 2)]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 3);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `arithmetic (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[==(add(int(content('shoeSize')), sub(7, mul(2, mod(6, 4)))), div(10, 2))]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 1);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `int comparison (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[or(and(>(int(content('shoeSize')), 1), <(int(content('shoeSize')), 3)), and(>=(int(content('shoeSize')), 89), <=(int(content('shoeSize')), 89)))]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const tribos = JSON.parse(result.data.documents[0].treeSequence.tribos);
      t.equal(tribos.data.length, 2);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `errors (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[and(>(int(content('shoeSize')), 1), <(zint(content('shoeSize')), 3))]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.startsWith('Predicate - Could not parse arguments to and'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Too few args (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[and(true)]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.startsWith('Predicate - Could not match and(true)'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Too many args (${testGroup})`,
  async function (t) {
    try {
      t.plan(3);
      const pk = new Proskomma();
      importGenealogyNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"nodes[==(1, 2, 3)]/node") }
                 }
               }`;
      result = await pk.gqlQuery(query);
      t.equal(result.errors.length, 1);
      t.ok(result.errors[0].message.startsWith('Predicate - Could not match ==(1, 2, 3)'));
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Syntax Tree (${testGroup})`,
  async function (t) {
    try {
      t.plan(2);
      const pk = new Proskomma();
      importJudeNodes(pk);
      let query = '{docSets { document(bookCode:"N00") { sequences(types:"tree") { id } } } }';
      let result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      const treeSequenceId = result.data.docSets[0].document.sequences[0].id;

      query = `{documents {
                 treeSequence(id:"${treeSequenceId}") {
                   tribos(query:"root/leaves/node{@text, @English}") }
                 }
               }`;
      const ts = Date.now();
      result = await pk.gqlQuery(query);
      // console.log(Date.now() - ts, 'msec')
      // console.log(JSON.stringify(JSON.parse(result.data.documents[0].treeSequence.tribos).data.map(n => [n.content.text, n.content.English])));
      t.equal(result.errors, undefined);
    } catch (err) {
      console.log(err);
    }
  },
);
