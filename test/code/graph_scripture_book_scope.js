const test = require('tape');

const {pkWithDoc} = require('../lib/load');

const testGroup = "Scripture Book Scope";

const pk = pkWithDoc("../test_data/usx/web_rut.usx", {lang: "fra", abbr: "hello"})[0];

test(
    `Bad bookScope (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '     mainSequence { blocks(withScriptureCV:2) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.equal(result.errors.filter(e => e.message.includes("cannot represent a non string value: 2")).length, 1);
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
                '      mainSequence { blocks(withScriptureCV:"2" withScopes:[]) { cBL } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Cannot specify both withScopes and withScriptureCV"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `One chapter (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureCV:"2") { text } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            t.ok(blocks[0].text.startsWith("Naomi had a relative of her husband"));
            t.ok(blocks[blocks.length - 1].text.endsWith("lived with her mother-in-law."));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Chapter range (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureCV:"1-3") { text } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            t.ok(blocks[0].text.startsWith("In the days when the judges judged"));
            t.ok(blocks[blocks.length - 1].text.endsWith("until he has settled this today.”"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Reverse chapter range (${testGroup})`,
    async function (t) {
        try {
            t.plan(2);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureCV:"3-1") { text } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors.length, 1);
            t.ok(result.errors[0].message.includes("Chapter range must be from min to max"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `One verse (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureCV:"1:14") { text } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            t.ok(blocks[0].text.startsWith("They lifted up their voices"));
            t.ok(blocks[blocks.length - 1].text.endsWith("Follow your sister-in-law.”"));
        } catch (err) {
            console.log(err)
        }
    }
);

test(
    `Verse range (${testGroup})`,
    async function (t) {
        try {
            t.plan(3);
            const query =
                '{ docSets { document: documentWithBook(bookCode:"RUT") {' +
                '      mainSequence { blocks(withScriptureCV:"1:10-13") { text } } } }' +
                '}';
            const result = await pk.gqlQuery(query);
            t.equal(result.errors, undefined);
            const blocks = result.data.docSets[0].document.mainSequence.blocks;
            t.ok(blocks[0].text.startsWith("Then she kissed them"));
            t.ok(blocks[blocks.length - 1].text.endsWith("hand has gone out against me.”"));
        } catch (err) {
            console.log(err)
        }
    }
);

