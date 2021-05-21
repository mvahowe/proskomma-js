const path = require('path');
const test = require('tape');
const fse = require('fs-extra');

const { Proskomma } = require('../../src');
const {
  customPkWithDoc,
  customPkWithDocs,
} = require('../lib/load');

const testGroup = 'Graph Selectors';

test(
  `selectors for root (${testGroup})`,
  async function (t) {
    try {
      t.plan(9);
      const query = '{ selectors { name type regex min max enum } }';
      const pk = new Proskomma();
      const result = await pk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('selectors' in result.data);
      const selectors = result.data.selectors;
      t.equal(selectors.length, 2);
      t.equal(selectors[0].name, 'lang');
      t.equal(selectors[0].type, 'string');
      t.equal(selectors[0].regex, '[a-z]{3}');
      t.equal(selectors[1].name, 'abbr');
      t.equal(selectors[1].type, 'string');
      t.equal(selectors[1].regex, null);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Throw on bad spec (${testGroup})`,
  async function (t) {
    try {
      t.plan(15);
      let selectors = [];
      const customProskomma = class extends Proskomma {
        constructor() {
          super();
          this.selectors = selectors;
          this.validateSelectors();
        }
      };
      t.throws(() => new customProskomma(), /No selectors found/);
      selectors = [{}];
      t.throws(() => new customProskomma(), /Selector.+has no name/);
      selectors = [{ name: 'foo' }];
      t.throws(() => new customProskomma(), /Selector.+has no type/);
      selectors = [{
        name: 'foo',
        type: 'banana',
      }];
      t.throws(() => new customProskomma(), /Type for selector/);
      selectors = [{
        name: 'foo',
        type: 'string',
        banana: 'split',
      }];
      t.throws(() => new customProskomma(), /Unexpected key/);
      selectors = [{
        name: 'foo',
        type: 'string',
        min: 23,
      }];
      t.throws(() => new customProskomma(), /should not include 'min'/);
      selectors = [{
        name: 'foo',
        type: 'string',
        max: 23,
      }];
      t.throws(() => new customProskomma(), /should not include 'max'/);
      selectors = [{
        name: 'foo',
        type: 'string',
        regex: '[',
      }];
      t.throws(() => new customProskomma(), /is not valid/);
      selectors = [{
        name: 'foo',
        type: 'string',
        enum: ['a', 'b', 23],
      }];
      t.throws(() => new customProskomma(), /should be strings/);
      selectors = [{
        name: 'foo',
        type: 'integer',
        regex: '[a]',
      }];
      t.throws(() => new customProskomma(), /should not include 'regex'/);
      selectors = [{
        name: 'foo',
        type: 'integer',
        min: '23',
      }];
      t.throws(() => new customProskomma(), /'min' must be a number/);
      selectors = [{
        name: 'foo',
        type: 'integer',
        max: '23',
      }];
      t.throws(() => new customProskomma(), /'max' must be a number/);
      selectors = [{
        name: 'foo',
        type: 'integer',
        min: 23,
        max: 22,
      }];
      t.throws(() => new customProskomma(), /'min' cannot be greater than 'max'/);
      selectors = [{
        name: 'foo',
        type: 'integer',
        enum: [1, 2, '3'],
      }];
      t.throws(() => new customProskomma(), /should be numbers/);
      selectors = [
        {
          name: 'foo',
          type: 'string',
          regex: '.*',
          enum: ['a', 'b', 'c'],
        },
        {
          name: 'baa',
          type: 'integer',
          min: 1,
          max: 9,
          enum: [2, 4, 6],
        },
      ];
      t.doesNotThrow(() => new customProskomma());
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `Throw on bad selector name and type (${testGroup})`,
  async function (t) {
    try {
      t.plan(8);
      const customProskomma = class extends Proskomma {
        constructor() {
          super();
          this.selectors = [
            {
              name: 'foo',
              type: 'string',
              regex: '[a-z]+',
              enum: ['banana', 'mango', 'apple'],
            },
            {
              name: 'baa',
              type: 'integer',
              min: 1,
              max: 9,
              enum: [2, 4, 6, 8],
            },
          ];
          this.validateSelectors();
        }
      };
      const pk = new customProskomma();
      const content = fse.readFileSync(path.resolve(__dirname, '../test_data/usx/web_rut.usx'));
      let selectors = {};
      const importFn = () => pk.importDocument(
        selectors,
        'usx',
        content,
      );
      t.throws(importFn, /Expected selector 'foo' not found/);
      selectors = { banana: 23 };
      t.throws(importFn, /Unexpected selector/);
      selectors = {
        foo: 23,
        baa: 24,
      };
      t.throws(importFn, /is of type number \(expected string\)/);
      selectors = {
        foo: 'banana',
        baa: 24.5,
      };
      t.throws(importFn, /is not an integer/);
      selectors = {
        foo: 'banana',
        baa: 7,
      };
      t.throws(importFn, /is not in enum/);
      selectors = {
        foo: 'orange',
        baa: 8,
      };
      t.throws(importFn, /is not in enum/);
      selectors = {
        foo: '123',
        baa: 8,
      };
      t.throws(importFn, /does not match regex/);
      selectors = {
        foo: 'banana',
        baa: 6,
      };
      t.doesNotThrow(importFn);
    } catch (err) {
      console.log(err);
    }
  },
);

test(
  `selectors in graph for docSet (${testGroup})`,
  async function (t) {
    try {
      const customProskomma = class extends Proskomma {
        constructor() {
          super();
          this.selectors = [
            {
              name: 'foo',
              type: 'string',
            },
            {
              name: 'baa',
              type: 'integer',
            },
          ];
          this.validateSelectors();
        }
      };
      let cpk = customPkWithDoc(customProskomma, '../test_data/usx/web_rut.usx', {
        foo: 'banana',
        baa: 23,
      })[0];
      t.plan(17);
      let query = '{ docSets { id selectors { key value } } }';
      let result = await cpk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.ok('selectors' in result.data.docSets[0]);
      const selectors = result.data.docSets[0].selectors;
      t.equal(selectors[0].key, 'foo');
      t.equal(selectors[0].value, 'banana');
      t.equal(selectors[1].key, 'baa');
      t.equal(selectors[1].value, '23');
      t.equal(result.data.docSets[0].id, 'banana_23');
      cpk = customPkWithDocs(customProskomma, [
        ['../test_data/usx/web_rut.usx', {
          foo: 'banana',
          baa: 23,
        }],
        ['../test_data/usx/web_psa150.usx', {
          foo: 'banana',
          baa: 48,
        }],
        ['../test_data/usx/fig.usx', {
          foo: 'mango',
          baa: 48,
        }],
      ]);
      query = '{ docSets { foo: selector(id:"foo") baa: selector(id:"baa") } }';
      result = await cpk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 3);
      query = '{ docSets(withSelectors:[{key:"foo", value:"banana"}]) { foo: selector(id:"foo") baa: selector(id:"baa") } }';
      result = await cpk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 2);
      query = '{ docSets(withSelectors:[{key:"baa", value:"48"}]) { foo: selector(id:"foo") baa: selector(id:"baa") } }';
      result = await cpk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 2);
      query = '{ docSets(withSelectors:[{key: "foo", value:"banana"}, {key:"baa", value:"48"}]) { foo: selector(id:"foo") baa: selector(id:"baa") } }';
      result = await cpk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 1);
      query = '{ docSets(withSelectors:[{key:"foo", value:"durian"}]) { foo: selector(id:"foo") baa: selector(id:"baa") } }';
      result = await cpk.gqlQuery(query);
      t.equal(result.errors, undefined);
      t.equal(result.data.docSets.length, 0);
    } catch (err) {
      console.log(err);
    }
  },
);
