const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Scripture Book Scope";

const pk = pkWithDoc("../test_data/usx/web_rut.usx", {lang: "fra", abbr: "hello"})[0];

test(
    `Bad bookScope (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '     mainSequence { blocks(withScriptureBookScope:{book:3}) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 2);
            t.equal(result.errors.filter(e => e.message.includes("was not provided")).length, 1);
            t.equal(result.errors.filter(e => e.message.includes("cannot represent a non string value: 3")).length, 1);
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `bookScope + withScopes (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureBookScope:{book:"RUT", cvs:"1"} withScopes:[]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Cannot specify both withScopes and forScriptureBookScope"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `One chapter (${testGroup})`,
    async function (t) {
        try {
            t.plan(1);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureBookScope:{book:"RUT", cvs:"1"}) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
        } catch (err) {
            console.log(err)
        }
    }
);
