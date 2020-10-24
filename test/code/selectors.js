const test = require('tape');
const fse = require('fs-extra');
const path = require('path');

const {ProsKomma} = require('../../');
const {pkWithDoc, pkWithDocs} = require('../lib/load');

const testGroup = "Graph Selectors";

const pk = pkWithDocs([
    ["../test_data/usx/web_rut.usx", {lang: "eng", abbr: "webbe"}],
    ["../test_data/usx/web_psa150.usx", {lang: "eng", abbr: "webbe"}]
]);

test(
    `selectors for root (${testGroup})`,
    async function (t) {
        try {
            t.plan(9);
            const query = '{ selectors { name type regex min max enum } }';
            const pk = new ProsKomma();
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.ok("selectors" in result.data);
            const selectors = result.data.selectors;
            t.equal(selectors.length, 2);
            t.equal(selectors[0].name, "lang");
            t.equal(selectors[0].type, "string");
            t.equal(selectors[0].regex, "[a-z]{3}");
            t.equal(selectors[1].name, "abbr");
            t.equal(selectors[1].type, "string");
            t.equal(selectors[1].regex, null);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `selectors for docSet (${testGroup})`,
    async function (t) {
        try {
            t.plan(6);
            const query = '{ docSets { selectors { key value } } }';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            t.ok("selectors" in result.data.docSets[0]);
            const selectors = result.data.docSets[0].selectors;
            t.equal(selectors[0].key, "lang");
            t.equal(selectors[0].value, "eng");
            t.equal(selectors[1].key, "abbr");
            t.equal(selectors[1].value, "webbe");
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Throw on bad spec (${testGroup})`,
    async function (t) {
        try {
            t.plan(6);
            let selectors = [];
            const customProsKomma = class extends ProsKomma {
                constructor() {
                    super();
                    this.selectors = selectors;
                    this.validateSelectors();
                }
            }
            t.throws(() => new customProsKomma(), /No selectors found/);
            selectors = [{}];
            t.throws(() => new customProsKomma(), /Selector.+has no name/);
            selectors = [{name: "foo"}];
            t.throws(() => new customProsKomma(), /Selector.+has no type/);
            selectors = [{name: "foo", type: "banana"}];
            t.throws(() => new customProsKomma(), /Type for selector/);
            selectors = [{name: "foo", type: "string", banana: "split"}];
            t.throws(() => new customProsKomma(), /Unexpected key/);
            selectors = [{name: "foo", type: "string"}];
            t.doesNotThrow(() => new customProsKomma());
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Throw on bad selectors (${testGroup})`,
    async function (t) {
        try {
            // t.plan(6);
            const customProsKomma = class extends ProsKomma {
                constructor() {
                    super();
                    this.selectors = [
                        {
                            name: "foo",
                            type: "string"
                        },
                        {
                            name: "baa",
                            type: "integer"
                        }
                    ];
                    this.validateSelectors();
                }
            }
            const pk = new customProsKomma();
            const content = fse.readFileSync(path.resolve(__dirname, "../test_data/usx/web_rut.usx"));
            let selectors = {};
            const importFn = () => pk.importDocument(
                selectors,
                "usx",
                content,
                {}
            );
            t.throws(importFn, /Expected selector 'foo' not found/);
        } catch (err) {
            console.log(err)
        }
    }
);

